import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { nanoid } from 'nanoid';
import { GenerateRequest } from '../types';
import { stripExif, validateImage } from '../utils/exif';
import { uploadInput } from '../services/storage';
import { enqueueGenerate } from '../jobs/queue';
import { moderatePrompt } from '../services/moderation';
import { tierGate } from '../middleware/tierGate';
import { isStyleAllowed, isSizeAllowed, OutputSize } from '../services/tierConfig';
import { logger } from '../utils/logger';

export async function generateRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /generate
   * Accepts multipart: image file + JSON params
   * Returns: { jobId }
   */
  app.post('/generate', { preHandler: [tierGate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parts = request.parts();
    let imageBuffer: Buffer | null = null;
    let params: any = {};

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'image') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        imageBuffer = Buffer.concat(chunks);
      } else if (part.type === 'field' && part.fieldname === 'params') {
        try {
          params = JSON.parse(part.value as string);
        } catch {
          return reply.status(400).send({ error: 'Invalid JSON in params field' });
        }
      }
    }

    if (!imageBuffer) {
      return reply.status(400).send({ error: 'Missing image file' });
    }

    // Validate image
    try {
      await validateImage(imageBuffer);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }

    // Parse and validate params
    const parseResult = GenerateRequest.safeParse(params);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid parameters',
        details: parseResult.error.flatten(),
      });
    }
    const genRequest = parseResult.data;

    // Tier gating: style
    if (!isStyleAllowed(genRequest.styleId, request.tier)) {
      return reply.status(403).send({
        error: 'pro_required',
        message: `Style "${genRequest.styleId}" requires QuipPix Pro`,
      });
    }

    // Tier gating: output size
    const outputSize = (genRequest.outputSize ?? '1024x1024') as OutputSize;
    if (!isSizeAllowed(outputSize, request.tier)) {
      return reply.status(403).send({
        error: 'pro_required',
        message: `Output size "${outputSize}" requires QuipPix Pro`,
      });
    }

    // Quick pre-moderation on user prompt
    if (genRequest.userPrompt) {
      const modCheck = moderatePrompt(genRequest.userPrompt);
      if (!modCheck.allowed) {
        return reply.status(422).send({
          error: 'content_policy',
          message: modCheck.reason,
          safeAlternative: modCheck.safeAlternative,
        });
      }
    }

    // Strip EXIF metadata
    const cleanImage = await stripExif(imageBuffer);

    // Upload to temporary storage
    const inputKey = await uploadInput(cleanImage);

    // Enqueue generation job
    const jobId = nanoid(12);
    enqueueGenerate(jobId, inputKey, genRequest, request.tier, outputSize);

    logger.info({ jobId, styleId: genRequest.styleId, tier: request.tier }, 'Generation request accepted');

    return reply.status(202).send({ jobId });
  });
}
