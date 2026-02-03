import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DailyChallenge, ChallengeResponse, ChallengeSubmission } from '../types';
import type { StyleId } from '../types';
import { logger } from '../utils/logger';

// ─── Challenge Pool ─────────────────────────────────────────────────
// 90 challenges that rotate by day-of-year, ensuring all users see the
// same challenge on any given day.

const CHALLENGE_POOL: Omit<DailyChallenge, 'id' | 'date'>[] = [
  { title: 'Superhero Self-Portrait', description: 'Transform yourself into a superhero using Comic Book style', creativePrompt: 'Turn me into a bold, dynamic superhero with a dramatic cape and heroic pose', suggestedStyleId: 'comic-book' as StyleId, icon: '🦸', hashtag: '#QuipPixHero', difficulty: 'easy' },
  { title: 'Renaissance You', description: 'Turn your selfie into a classical oil painting masterpiece', creativePrompt: 'Paint me as a Renaissance noble in a grand oil painting with rich, warm tones', suggestedStyleId: 'oil-painting' as StyleId, icon: '🎨', hashtag: '#QuipPixRenaissance', difficulty: 'medium' },
  { title: 'Neon Dreams', description: 'Go full cyberpunk with neon lighting and futuristic vibes', creativePrompt: 'Place me in a neon-lit cyberpunk city at night with glowing accents', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '🌆', hashtag: '#QuipPixNeon', difficulty: 'medium' },
  { title: 'Magazine Star', description: 'Put yourself on a magazine cover with custom headlines', creativePrompt: 'Create a high-fashion magazine cover with dramatic lighting and bold typography', suggestedStyleId: 'magazine-cover' as StyleId, icon: '📖', hashtag: '#QuipPixCover', difficulty: 'hard' },
  { title: 'Anime Transformation', description: 'See yourself reimagined in anime style', creativePrompt: 'Transform me into an anime character with large expressive eyes and dynamic hair', suggestedStyleId: 'anime-inspired' as StyleId, icon: '⭐', hashtag: '#QuipPixAnime', difficulty: 'easy' },
  { title: 'Watercolor Mood', description: 'Create a peaceful, flowy watercolor portrait', creativePrompt: 'Paint me in soft, flowing watercolors with gentle color bleeds and dreamy edges', suggestedStyleId: 'watercolor' as StyleId, icon: '🌊', hashtag: '#QuipPixWatercolor', difficulty: 'easy' },
  { title: 'Pop Art Icon', description: 'Channel your inner Warhol with a bold pop art piece', creativePrompt: 'Create a Warhol-style pop art portrait with bold outlines and vibrant flat colors', suggestedStyleId: 'pop-art' as StyleId, icon: '🎯', hashtag: '#QuipPixPopArt', difficulty: 'easy' },
  { title: 'Pro Headshot', description: 'Turn a casual photo into a professional headshot', creativePrompt: 'Transform this into a polished, professional headshot with soft studio lighting', suggestedStyleId: 'pro-headshot' as StyleId, icon: '📸', hashtag: '#QuipPixHeadshot', difficulty: 'medium' },
  { title: 'Pencil Sketch', description: 'Reduce your photo to elegant pencil lines', creativePrompt: 'Draw me as a clean, detailed pencil sketch with precise linework', suggestedStyleId: 'pencil-clean' as StyleId, icon: '✏️', hashtag: '#QuipPixSketch', difficulty: 'easy' },
  { title: 'Dreamy Portrait', description: 'Create an ethereal, soft-focus portrait', creativePrompt: 'Give me a dreamy, ethereal quality with soft focus and pastel light leaks', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '✨', hashtag: '#QuipPixDreamy', difficulty: 'medium' },
  { title: 'Editorial Glam', description: 'High-fashion editorial photography vibes', creativePrompt: 'Shoot me for a high-fashion editorial with dramatic shadows and bold composition', suggestedStyleId: 'editorial-fashion' as StyleId, icon: '💅', hashtag: '#QuipPixEditorial', difficulty: 'hard' },
  { title: 'Classic Caricature', description: 'Get a fun, exaggerated caricature of yourself', creativePrompt: 'Draw me as a fun caricature with exaggerated features and a humorous twist', suggestedStyleId: 'caricature-classic' as StyleId, icon: '😄', hashtag: '#QuipPixCaricature', difficulty: 'easy' },
  { title: 'Subtle Caricature', description: 'A gentle, elegant caricature that keeps your likeness', creativePrompt: 'Create a subtle caricature that gently exaggerates while preserving my identity', suggestedStyleId: 'caricature-subtle' as StyleId, icon: '🎭', hashtag: '#QuipPixSubtle', difficulty: 'medium' },
  { title: 'Gritty Pencil', description: 'Raw, textured pencil art with character', creativePrompt: 'Sketch me in a gritty, textured pencil style with rough cross-hatching and character', suggestedStyleId: 'pencil-gritty' as StyleId, icon: '🖊️', hashtag: '#QuipPixGritty', difficulty: 'medium' },
  { title: 'Monday Motivation', description: 'Create an inspiring portrait to start the week', creativePrompt: 'Make me look confident and inspiring, ready to conquer the week ahead', suggestedStyleId: 'pro-headshot' as StyleId, icon: '💪', hashtag: '#QuipPixMonday', difficulty: 'easy' },
  { title: 'Villain Arc', description: 'Embrace your dark side with a dramatic villain portrait', creativePrompt: 'Transform me into a stylish, dramatic villain with dark atmosphere and intensity', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '🦹', hashtag: '#QuipPixVillain', difficulty: 'hard' },
  { title: 'Golden Hour', description: 'Capture that perfect warm golden hour glow', creativePrompt: 'Bathe me in warm golden hour sunlight with soft lens flare and honey tones', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '🌅', hashtag: '#QuipPixGoldenHour', difficulty: 'easy' },
  { title: 'Street Art Star', description: 'Turn yourself into a colorful street art mural', creativePrompt: 'Paint me as a vibrant street art mural with dripping paint and urban textures', suggestedStyleId: 'pop-art' as StyleId, icon: '🎨', hashtag: '#QuipPixStreetArt', difficulty: 'medium' },
  { title: 'Noir Detective', description: 'Channel film noir with dramatic shadows', creativePrompt: 'Place me in a film noir scene with dramatic shadows, venetian blind light, black and white', suggestedStyleId: 'pencil-gritty' as StyleId, icon: '🕵️', hashtag: '#QuipPixNoir', difficulty: 'hard' },
  { title: 'Fantasy Warrior', description: 'Become an epic fantasy warrior', creativePrompt: 'Transform me into an epic fantasy warrior with armor and a dramatic landscape behind', suggestedStyleId: 'oil-painting' as StyleId, icon: '⚔️', hashtag: '#QuipPixWarrior', difficulty: 'medium' },
  { title: 'Minimalist Portrait', description: 'Less is more - a clean, minimal portrait', creativePrompt: 'Create a clean minimalist portrait with simple lines and lots of negative space', suggestedStyleId: 'pencil-clean' as StyleId, icon: '⬜', hashtag: '#QuipPixMinimal', difficulty: 'easy' },
  { title: 'Vintage Vibes', description: 'Travel back in time with a retro look', creativePrompt: 'Give me a warm vintage 1970s look with film grain, faded colors, and retro styling', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '📻', hashtag: '#QuipPixVintage', difficulty: 'easy' },
  { title: 'Anime Hero', description: 'Become the protagonist of your own anime', creativePrompt: 'Make me the hero of a shonen anime with wind-blown hair and determined eyes', suggestedStyleId: 'anime-inspired' as StyleId, icon: '🔥', hashtag: '#QuipPixAnimeHero', difficulty: 'medium' },
  { title: 'Royal Portrait', description: 'Get the royal treatment in a regal painting', creativePrompt: 'Paint me as royalty in ornate robes with a golden crown and majestic backdrop', suggestedStyleId: 'oil-painting' as StyleId, icon: '👑', hashtag: '#QuipPixRoyal', difficulty: 'hard' },
  { title: 'Comic Villain', description: 'Become an iconic comic book villain', creativePrompt: 'Draw me as a menacing comic book villain with dramatic lighting and bold colors', suggestedStyleId: 'comic-book' as StyleId, icon: '💀', hashtag: '#QuipPixComicVillain', difficulty: 'medium' },
  { title: 'Watercolor Botanica', description: 'Surround yourself with painted flowers', creativePrompt: 'Paint me surrounded by beautiful watercolor flowers and botanical elements', suggestedStyleId: 'watercolor' as StyleId, icon: '🌸', hashtag: '#QuipPixBotanica', difficulty: 'easy' },
  { title: 'Cyberpunk Samurai', description: 'Futuristic warrior of the neon city', creativePrompt: 'Transform me into a cyberpunk samurai with neon-edged armor in a rain-soaked city', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '🗡️', hashtag: '#QuipPixCyberSamurai', difficulty: 'hard' },
  { title: 'Fashion Week', description: 'Strut your stuff on the runway', creativePrompt: 'Photograph me walking a high-fashion runway with dramatic editorial lighting', suggestedStyleId: 'editorial-fashion' as StyleId, icon: '👠', hashtag: '#QuipPixFashionWeek', difficulty: 'medium' },
  { title: 'Cartoon Me', description: 'Get a playful cartoon makeover', creativePrompt: 'Turn me into a playful cartoon character with bright colors and fun expressions', suggestedStyleId: 'caricature-classic' as StyleId, icon: '🎪', hashtag: '#QuipPixCartoon', difficulty: 'easy' },
  { title: 'Studio Portrait', description: 'Professional studio quality portrait', creativePrompt: 'Create a studio-quality portrait with Rembrandt lighting and a clean backdrop', suggestedStyleId: 'pro-headshot' as StyleId, icon: '💡', hashtag: '#QuipPixStudio', difficulty: 'medium' },
  // ─── 30 more challenges ───────────────────────────────────────────
  { title: 'Ocean Breeze', description: 'Coastal vibes in watercolor', creativePrompt: 'Paint me with an ocean breeze, seaspray, and coastal watercolor tones', suggestedStyleId: 'watercolor' as StyleId, icon: '🏖️', hashtag: '#QuipPixOcean', difficulty: 'easy' },
  { title: 'Manga Moment', description: 'A dramatic manga panel starring you', creativePrompt: 'Draw me in a dramatic manga panel with speed lines and intense expression', suggestedStyleId: 'anime-inspired' as StyleId, icon: '📚', hashtag: '#QuipPixManga', difficulty: 'medium' },
  { title: 'Charcoal Study', description: 'Deep, rich charcoal portrait', creativePrompt: 'Render me in rich charcoal with deep blacks and dramatic contrast', suggestedStyleId: 'pencil-gritty' as StyleId, icon: '🖤', hashtag: '#QuipPixCharcoal', difficulty: 'medium' },
  { title: 'Neon Nights', description: 'Glowing in the city nightlife', creativePrompt: 'Light me up with neon reflections on a rainy city night', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '🌃', hashtag: '#QuipPixNeonNights', difficulty: 'easy' },
  { title: 'Impressionist Garden', description: 'Monet-style brushwork and light', creativePrompt: 'Paint me in a garden with loose impressionist brushstrokes and dappled light', suggestedStyleId: 'oil-painting' as StyleId, icon: '🌻', hashtag: '#QuipPixImpressionist', difficulty: 'medium' },
  { title: 'Vogue Cover', description: 'Cover star of the month', creativePrompt: 'Style me for a Vogue magazine cover with high-contrast fashion photography', suggestedStyleId: 'magazine-cover' as StyleId, icon: '📰', hashtag: '#QuipPixVogue', difficulty: 'hard' },
  { title: 'Zen Portrait', description: 'Find inner peace in minimalist art', creativePrompt: 'Create a serene, zen-inspired portrait with minimal brushwork and calm energy', suggestedStyleId: 'watercolor' as StyleId, icon: '🧘', hashtag: '#QuipPixZen', difficulty: 'easy' },
  { title: 'Retro Comic', description: 'Classic silver-age comic book style', creativePrompt: 'Draw me in retro silver-age comic style with halftone dots and speech bubbles', suggestedStyleId: 'comic-book' as StyleId, icon: '💥', hashtag: '#QuipPixRetroComic', difficulty: 'medium' },
  { title: 'Sunset Silhouette', description: 'Dramatic silhouette against a sunset', creativePrompt: 'Create a dramatic silhouette portrait against a vibrant painted sunset sky', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '🌇', hashtag: '#QuipPixSilhouette', difficulty: 'easy' },
  { title: 'Pop Culture Icon', description: 'Become a pop culture legend', creativePrompt: 'Turn me into a pop culture icon with bold colors, patterns, and cultural references', suggestedStyleId: 'pop-art' as StyleId, icon: '🌟', hashtag: '#QuipPixPopIcon', difficulty: 'medium' },
  // ─── 30 more challenges ───────────────────────────────────────────
  { title: 'Enchanted Forest', description: 'Mystical woodland portrait', creativePrompt: 'Place me in a magical enchanted forest with ethereal light filtering through trees', suggestedStyleId: 'oil-painting' as StyleId, icon: '🌲', hashtag: '#QuipPixEnchanted', difficulty: 'medium' },
  { title: 'Space Explorer', description: 'Adventure among the stars', creativePrompt: 'Suit me up as a space explorer with stars and nebulae in the background', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '🚀', hashtag: '#QuipPixSpace', difficulty: 'hard' },
  { title: 'Cozy Aesthetic', description: 'Warm, cozy autumn vibes', creativePrompt: 'Wrap me in cozy autumn vibes with warm sweaters, soft light, and falling leaves', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '🍂', hashtag: '#QuipPixCozy', difficulty: 'easy' },
  { title: 'Line Art', description: 'Elegant single-line portrait', creativePrompt: 'Draw me as an elegant single continuous line art portrait', suggestedStyleId: 'pencil-clean' as StyleId, icon: '〰️', hashtag: '#QuipPixLineArt', difficulty: 'easy' },
  { title: 'Gothic Portrait', description: 'Dark, romantic gothic style', creativePrompt: 'Paint me in dark romantic gothic style with deep shadows and dramatic atmosphere', suggestedStyleId: 'oil-painting' as StyleId, icon: '🏰', hashtag: '#QuipPixGothic', difficulty: 'hard' },
  { title: 'Beach Day', description: 'Fun in the sun watercolor', creativePrompt: 'Paint a fun beach day scene with bright watercolor splashes and sunny vibes', suggestedStyleId: 'watercolor' as StyleId, icon: '🏄', hashtag: '#QuipPixBeach', difficulty: 'easy' },
  { title: 'Futuristic ID', description: 'Your identity card from 2077', creativePrompt: 'Create a futuristic holographic ID card portrait from the year 2077', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '🆔', hashtag: '#QuipPixFutureID', difficulty: 'medium' },
  { title: 'Storybook Character', description: 'Step into a fairy tale illustration', creativePrompt: 'Illustrate me as a character in a classic fairy tale storybook', suggestedStyleId: 'watercolor' as StyleId, icon: '📖', hashtag: '#QuipPixStorybook', difficulty: 'easy' },
  { title: 'Album Cover', description: 'Design your debut album cover', creativePrompt: 'Create a striking album cover portrait with artistic typography and mood', suggestedStyleId: 'pop-art' as StyleId, icon: '🎵', hashtag: '#QuipPixAlbum', difficulty: 'medium' },
  { title: 'Twin Peaks', description: 'Surreal and mysterious portrait', creativePrompt: 'Give me a surreal Twin Peaks vibe with eerie atmosphere and mysterious quality', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '🦉', hashtag: '#QuipPixSurreal', difficulty: 'hard' },
  { title: 'Kawaii Me', description: 'Ultra-cute kawaii style portrait', creativePrompt: 'Transform me into an adorable kawaii character with sparkles and pastel colors', suggestedStyleId: 'anime-inspired' as StyleId, icon: '🌈', hashtag: '#QuipPixKawaii', difficulty: 'easy' },
  { title: 'Wild West', description: 'Wanted poster from the frontier', creativePrompt: 'Put me on a dusty Wild West wanted poster with aged paper and frontier style', suggestedStyleId: 'pencil-gritty' as StyleId, icon: '🤠', hashtag: '#QuipPixWildWest', difficulty: 'medium' },
  { title: 'Neon Punk', description: 'Rebellious neon punk attitude', creativePrompt: 'Give me full neon punk attitude with mohawk vibes, chains, and electric energy', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '🎸', hashtag: '#QuipPixPunk', difficulty: 'medium' },
  { title: 'Classical Sculpture', description: 'Marble statue version of you', creativePrompt: 'Sculpt me as a classical Greek marble statue with perfect proportions', suggestedStyleId: 'pencil-clean' as StyleId, icon: '🏛️', hashtag: '#QuipPixSculpture', difficulty: 'hard' },
  { title: 'Cherry Blossom', description: 'Spring cherry blossom portrait', creativePrompt: 'Paint me under falling cherry blossoms with soft pink petals and gentle light', suggestedStyleId: 'watercolor' as StyleId, icon: '🌸', hashtag: '#QuipPixCherry', difficulty: 'easy' },
  { title: 'Comic Strip', description: 'A 4-panel comic starring you', creativePrompt: 'Draw me in a fun comic strip panel with action lines and speech bubbles', suggestedStyleId: 'comic-book' as StyleId, icon: '🗯️', hashtag: '#QuipPixComicStrip', difficulty: 'medium' },
  { title: 'Abstract You', description: 'Abstract art interpretation of your portrait', creativePrompt: 'Deconstruct my portrait into abstract geometric shapes and bold color blocks', suggestedStyleId: 'pop-art' as StyleId, icon: '🔷', hashtag: '#QuipPixAbstract', difficulty: 'hard' },
  { title: 'Winter Wonderland', description: 'Snowy, frosty portrait magic', creativePrompt: 'Place me in a magical winter wonderland with snowflakes and frosty breath', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '❄️', hashtag: '#QuipPixWinter', difficulty: 'easy' },
  { title: 'Sports Star', description: 'Athletic magazine cover portrait', creativePrompt: 'Photograph me as a sports magazine cover athlete with action and intensity', suggestedStyleId: 'magazine-cover' as StyleId, icon: '🏆', hashtag: '#QuipPixSports', difficulty: 'medium' },
  { title: 'Saturday Selfie', description: 'Weekend vibes portrait', creativePrompt: 'Capture relaxed weekend energy with natural light and easygoing style', suggestedStyleId: 'caricature-subtle' as StyleId, icon: '🤳', hashtag: '#QuipPixSaturday', difficulty: 'easy' },
  // ─── 30 more challenges ───────────────────────────────────────────
  { title: 'Steampunk Inventor', description: 'Gears, goggles, and Victorian tech', creativePrompt: 'Transform me into a steampunk inventor with brass goggles and clockwork gadgets', suggestedStyleId: 'oil-painting' as StyleId, icon: '⚙️', hashtag: '#QuipPixSteampunk', difficulty: 'hard' },
  { title: 'Pastel Dream', description: 'Soft pastel color palette portrait', creativePrompt: 'Paint me entirely in soft pastels — lavender, mint, blush, and cream tones', suggestedStyleId: 'watercolor' as StyleId, icon: '🍬', hashtag: '#QuipPixPastel', difficulty: 'easy' },
  { title: 'Action Hero', description: 'Blockbuster movie poster vibes', creativePrompt: 'Put me on a blockbuster action movie poster with explosions and dramatic angles', suggestedStyleId: 'comic-book' as StyleId, icon: '🎬', hashtag: '#QuipPixAction', difficulty: 'medium' },
  { title: 'Botanical Self', description: 'Portrait intertwined with nature', creativePrompt: 'Weave flowers and vines through my portrait in a botanical illustration style', suggestedStyleId: 'pencil-clean' as StyleId, icon: '🌿', hashtag: '#QuipPixBotanical', difficulty: 'medium' },
  { title: 'Electric Soul', description: 'Energy and lightning portrait', creativePrompt: 'Surround me with electric arcs and lightning energy in vibrant neon', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '⚡', hashtag: '#QuipPixElectric', difficulty: 'medium' },
  { title: 'Vintage Hollywood', description: 'Old Hollywood glamour portrait', creativePrompt: 'Give me classic Hollywood glamour with soft lighting and timeless elegance', suggestedStyleId: 'editorial-fashion' as StyleId, icon: '🎞️', hashtag: '#QuipPixHollywood', difficulty: 'medium' },
  { title: 'Emoji Me', description: 'Turn yourself into a human emoji', creativePrompt: 'Turn me into a fun human emoji with exaggerated, expressive cartoon features', suggestedStyleId: 'caricature-classic' as StyleId, icon: '😎', hashtag: '#QuipPixEmoji', difficulty: 'easy' },
  { title: 'Galaxy Portrait', description: 'Cosmic stars and nebulae within you', creativePrompt: 'Fill my silhouette with galaxies, stars, and swirling cosmic nebulae', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '🌌', hashtag: '#QuipPixGalaxy', difficulty: 'hard' },
  { title: 'Ink Wash', description: 'Traditional ink wash painting style', creativePrompt: 'Paint me in traditional East Asian ink wash style with flowing black ink', suggestedStyleId: 'pencil-gritty' as StyleId, icon: '🖋️', hashtag: '#QuipPixInkWash', difficulty: 'medium' },
  { title: 'Festival Ready', description: 'Music festival glitter and glow', creativePrompt: 'Get me festival-ready with face glitter, neon paint, and electric atmosphere', suggestedStyleId: 'pop-art' as StyleId, icon: '🎪', hashtag: '#QuipPixFestival', difficulty: 'easy' },
  { title: 'Moonlight Portrait', description: 'Bathed in soft moonlight', creativePrompt: 'Paint me under cool moonlight with silver highlights and deep blue shadows', suggestedStyleId: 'oil-painting' as StyleId, icon: '🌙', hashtag: '#QuipPixMoonlight', difficulty: 'medium' },
  { title: 'Pixel Art', description: 'Retro 16-bit pixel art portrait', creativePrompt: 'Convert me into a charming 16-bit pixel art character sprite', suggestedStyleId: 'pop-art' as StyleId, icon: '🕹️', hashtag: '#QuipPixPixel', difficulty: 'easy' },
  { title: 'Mythical Creature', description: 'Half-human, half-myth', creativePrompt: 'Transform me into a mythical creature — part human, part magical being', suggestedStyleId: 'oil-painting' as StyleId, icon: '🐉', hashtag: '#QuipPixMythical', difficulty: 'hard' },
  { title: 'Film Grain', description: 'Nostalgic analog film look', creativePrompt: 'Give me a nostalgic 35mm film look with warm grain and light leaks', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '📷', hashtag: '#QuipPixFilm', difficulty: 'easy' },
  { title: 'Architecture Portrait', description: 'Your face meets famous architecture', creativePrompt: 'Blend my portrait with iconic architectural elements and clean geometry', suggestedStyleId: 'pencil-clean' as StyleId, icon: '🏗️', hashtag: '#QuipPixArchitecture', difficulty: 'hard' },
  { title: 'Superhero Team', description: 'Assemble your superhero identity', creativePrompt: 'Create my superhero alter ego with a unique costume and power effects', suggestedStyleId: 'comic-book' as StyleId, icon: '🦸‍♂️', hashtag: '#QuipPixSuper', difficulty: 'medium' },
  { title: 'Tropical Paradise', description: 'Island vibes portrait', creativePrompt: 'Place me in a tropical paradise with palm trees, turquoise water, and sunset', suggestedStyleId: 'watercolor' as StyleId, icon: '🌴', hashtag: '#QuipPixTropical', difficulty: 'easy' },
  { title: 'Dark Academia', description: 'Scholarly, moody aesthetic', creativePrompt: 'Give me a dark academia aesthetic with warm library lighting and scholarly mood', suggestedStyleId: 'oil-painting' as StyleId, icon: '📚', hashtag: '#QuipPixAcademia', difficulty: 'medium' },
  { title: 'Glitch Art', description: 'Digital glitch distortion portrait', creativePrompt: 'Distort my portrait with digital glitch effects, scan lines, and RGB splits', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '📺', hashtag: '#QuipPixGlitch', difficulty: 'medium' },
  { title: 'Sunday Sketch', description: 'Relaxed weekend pencil drawing', creativePrompt: 'Create a relaxed, loose pencil sketch as if drawn in a sunny park on Sunday', suggestedStyleId: 'pencil-clean' as StyleId, icon: '☕', hashtag: '#QuipPixSunday', difficulty: 'easy' },
  { title: 'Stained Glass', description: 'Portrait in vivid stained glass panels', creativePrompt: 'Render me as a stained glass window with bold lead lines and jewel-toned light', suggestedStyleId: 'pop-art' as StyleId, icon: '🪟', hashtag: '#QuipPixStainedGlass', difficulty: 'medium' },
  { title: 'Rainy Day', description: 'Moody portrait behind rain-streaked glass', creativePrompt: 'Photograph me through rain-streaked glass with soft city lights in the background', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '🌧️', hashtag: '#QuipPixRainyDay', difficulty: 'easy' },
  { title: 'Space Explorer', description: 'Blast off into a cosmic portrait', creativePrompt: 'Place me in a space helmet floating among stars and nebulae', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '🚀', hashtag: '#QuipPixSpace', difficulty: 'medium' },
  { title: 'Ink Wash', description: 'Traditional ink wash painting style', creativePrompt: 'Paint me in traditional East Asian ink wash style with flowing black ink on white', suggestedStyleId: 'watercolor' as StyleId, icon: '🖋️', hashtag: '#QuipPixInkWash', difficulty: 'medium' },
  { title: 'Mosaic Portrait', description: 'Ancient mosaic tile art', creativePrompt: 'Construct my portrait from tiny colorful mosaic tiles in a Byzantine style', suggestedStyleId: 'pop-art' as StyleId, icon: '🧩', hashtag: '#QuipPixMosaic', difficulty: 'hard' },
  { title: 'Candlelight', description: 'Intimate candlelight portrait', creativePrompt: 'Light me with warm flickering candlelight in a dark, intimate setting', suggestedStyleId: 'oil-painting' as StyleId, icon: '🕯️', hashtag: '#QuipPixCandlelight', difficulty: 'easy' },
  { title: 'Wild West', description: 'Wanted poster from the frontier', creativePrompt: 'Create a sepia-toned Wild West wanted poster featuring my portrait', suggestedStyleId: 'pencil-gritty' as StyleId, icon: '🤠', hashtag: '#QuipPixWildWest', difficulty: 'medium' },
  { title: 'Pastel Dream', description: 'Soft pastel chalk portrait', creativePrompt: 'Draw me in soft pastel chalks with gentle blending and dreamy colors', suggestedStyleId: 'dreamy-portrait' as StyleId, icon: '🩷', hashtag: '#QuipPixPastel', difficulty: 'easy' },
  { title: 'Graffiti Wall', description: 'Urban graffiti portrait on concrete', creativePrompt: 'Spray-paint my portrait on a textured concrete wall with drips and tags', suggestedStyleId: 'comic-book' as StyleId, icon: '🎤', hashtag: '#QuipPixGraffiti', difficulty: 'medium' },
  { title: 'Crystal Portrait', description: 'Geometric crystal facet art', creativePrompt: 'Shatter my portrait into geometric crystal facets with prismatic light refractions', suggestedStyleId: 'cyberpunk-neon' as StyleId, icon: '💎', hashtag: '#QuipPixCrystal', difficulty: 'hard' },
];

// ─── Submission tracking (in-memory; swap for DB in production) ─────
const submissionStore = new Map<string, ChallengeSubmission[]>();

function getSubmissionCount(challengeId: string): number {
  return submissionStore.get(challengeId)?.length ?? 0;
}

// ─── Deterministic daily challenge selection ────────────────────────
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDayOfYear(date: string): number {
  const d = new Date(date + 'T00:00:00Z');
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getChallengeForDate(date: string): DailyChallenge {
  const dayOfYear = getDayOfYear(date);
  const index = dayOfYear % CHALLENGE_POOL.length;
  const template = CHALLENGE_POOL[index];
  return {
    ...template,
    id: `challenge-${date}`,
    date,
  };
}

// ─── Routes ─────────────────────────────────────────────────────────
export async function challengeRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /challenge/today
   * Returns today's daily challenge. No auth required (free + pro).
   */
  app.get('/challenge/today', async (_request: FastifyRequest, _reply: FastifyReply) => {
    const today = getTodayString();
    const challenge = getChallengeForDate(today);
    const totalSubmissions = getSubmissionCount(challenge.id);

    const response: ChallengeResponse = {
      challenge,
      totalSubmissions,
    };

    return response;
  });

  /**
   * GET /challenge/:date
   * Returns the challenge for a specific date (for history).
   */
  app.get<{ Params: { date: string } }>(
    '/challenge/:date',
    async (request: FastifyRequest<{ Params: { date: string } }>, reply: FastifyReply) => {
      const { date } = request.params;

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return reply.status(400).send({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      }

      const challenge = getChallengeForDate(date);
      const totalSubmissions = getSubmissionCount(challenge.id);

      const response: ChallengeResponse = {
        challenge,
        totalSubmissions,
      };

      return response;
    },
  );

  /**
   * POST /challenge/submit
   * Records a challenge submission. Body: { challengeId, jobId }
   */
  app.post('/challenge/submit', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { challengeId?: string; jobId?: string };

    if (!body?.challengeId || !body?.jobId) {
      return reply.status(400).send({ error: 'Missing challengeId or jobId' });
    }

    const submission: ChallengeSubmission = {
      challengeId: body.challengeId,
      jobId: body.jobId,
      submittedAt: new Date().toISOString(),
    };

    const existing = submissionStore.get(body.challengeId) ?? [];
    existing.push(submission);
    submissionStore.set(body.challengeId, existing);

    logger.info({ challengeId: body.challengeId, jobId: body.jobId }, 'Challenge submission recorded');

    return reply.status(201).send({
      success: true,
      totalSubmissions: existing.length,
    });
  });
}
