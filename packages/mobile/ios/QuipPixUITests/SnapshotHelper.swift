//
//  SnapshotHelper.swift
//  Fastlane
//
//  Created by Felix Krause on 10/8/15.
//  Copyright © 2015 Felix Krause. All rights reserved.
//
//  Standard Fastlane snapshot helper — do not edit.
//  Latest version: https://github.com/fastlane/fastlane/blob/master/snapshot/lib/assets/SnapshotHelper.swift
//

import Foundation
import XCTest

var deviceLanguage = ""
var locale = ""

func setupSnapshot(_ app: XCUIApplication, waitForAnimations: Bool = true) {
    Snapshot.setupSnapshot(app, waitForAnimations: waitForAnimations)
}

func snapshot(_ name: String, waitForLoadingIndicator: Bool) {
    if waitForLoadingIndicator {
        Snapshot.snapshot(name)
    } else {
        Snapshot.snapshot(name, timeWaitingForIdle: 0)
    }
}

/// - Parameters:
///   - name: The name of the snapshot
///   - timeout: Amount of seconds to wait until the network loading indicator disappears. Pass 0 to skip waiting.
func snapshot(_ name: String, timeWaitingForIdle timeout: TimeInterval = 20) {
    Snapshot.snapshot(name, timeWaitingForIdle: timeout)
}

enum Snapshot {
    static var app: XCUIApplication?
    static var waitForAnimations = true
    static var cacheDirectory: URL?
    static var screenshotsDirectory: URL? {
        return cacheDirectory
    }

    static func setupSnapshot(_ app: XCUIApplication, waitForAnimations: Bool = true) {
        Snapshot.app = app
        Snapshot.waitForAnimations = waitForAnimations

        do {
            let cacheDir = try getCacheDirectory()
            Snapshot.cacheDirectory = cacheDir
            setLanguage(app)
            setLocale(app)
            setLaunchArguments(app)
        } catch {
            NSLog("Snapshot: Error setting up snapshot: \(error)")
        }
    }

    static func setLanguage(_ app: XCUIApplication) {
        guard let cacheDirectory = self.cacheDirectory else {
            NSLog("Snapshot: CacheDir is not set - call `setupSnapshot` before calling `snapshot`")
            return
        }

        do {
            let path = cacheDirectory.appendingPathComponent("language.txt")
            let trimCharacterSet = CharacterSet.whitespacesAndNewlines
            deviceLanguage = try String(contentsOf: path, encoding: .utf8).trimmingCharacters(in: trimCharacterSet)
            app.launchArguments += ["-AppleLanguages", "(\(deviceLanguage))"]
        } catch {
            NSLog("Snapshot: Couldn't detect/set language...")
        }
    }

    static func setLocale(_ app: XCUIApplication) {
        guard let cacheDirectory = self.cacheDirectory else {
            NSLog("Snapshot: CacheDir is not set - call `setupSnapshot` before calling `snapshot`")
            return
        }

        do {
            let path = cacheDirectory.appendingPathComponent("locale.txt")
            let trimCharacterSet = CharacterSet.whitespacesAndNewlines
            locale = try String(contentsOf: path, encoding: .utf8).trimmingCharacters(in: trimCharacterSet)
        } catch {
            NSLog("Snapshot: Couldn't detect/set locale...")
        }

        if locale.isEmpty && !deviceLanguage.isEmpty {
            locale = Locale(identifier: deviceLanguage).identifier
        }

        if !locale.isEmpty {
            app.launchArguments += ["-AppleLocale", "\"\(locale)\""]
        }
    }

    static func setLaunchArguments(_ app: XCUIApplication) {
        guard let cacheDirectory = self.cacheDirectory else {
            NSLog("Snapshot: CacheDir is not set - call `setupSnapshot` before calling `snapshot`")
            return
        }

        app.launchArguments += ["FASTLANE_SNAPSHOT", "YES"]
        let path = cacheDirectory.appendingPathComponent("snapshot-launch_arguments.txt")

        app.launchEnvironment["SNAPSHOT_SCREENSHOTS_DIR"] = cacheDirectory.path

        do {
            let launchArguments = try String(contentsOf: path, encoding: String.Encoding.utf8)
            let lines = launchArguments.components(separatedBy: .newlines)
            lines.forEach { line in
                let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    app.launchArguments.append(trimmed)
                }
            }
        } catch {
            NSLog("Snapshot: Couldn't read launch_arguments file")
        }
    }

    static func getCacheDirectory() throws -> URL {
        let cachePath = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true).first!
        let cacheDir = URL(fileURLWithPath: cachePath).appendingPathComponent("tools.fastlane")
        try FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true, attributes: nil)
        return cacheDir
    }

    static func snapshot(_ name: String, timeWaitingForIdle timeout: TimeInterval = 20) {
        guard let app = self.app else {
            NSLog("Snapshot: XCUIApplication is not set. Call setupSnapshot(app) first.")
            return
        }

        let networkLoadingIndicator = app.otherElements.deviceStatusBars.networkLoadingIndicators.element
        let networkLoadingIndicatorDisappeared = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: networkLoadingIndicator)

        if timeout > 0 {
            _ = XCTWaiter.wait(for: [networkLoadingIndicatorDisappeared], timeout: timeout)
        }

        if waitForAnimations {
            sleep(1)
        }

        NSLog("Snapshot: Taking snapshot '\(name)'")

        guard let cacheDir = self.cacheDirectory else {
            NSLog("Snapshot: CacheDir is not set")
            return
        }

        let screenshot = app.windows.firstMatch.screenshot()
        let data = screenshot.pngRepresentation

        let path = cacheDir.appendingPathComponent("\(name).png")
        do {
            try data.write(to: path)
        } catch {
            NSLog("Snapshot: Error writing screenshot: \(error)")
        }

        let activity = XCTContext.runActivity(named: "Snapshot: \(name)") { activity in
            let attachment = XCTAttachment(screenshot: screenshot)
            attachment.name = name
            attachment.lifetime = .keepAlways
            activity.add(attachment)
        }
    }
}

extension XCUIElementQuery {
    var networkLoadingIndicators: XCUIElementQuery {
        let isNetworkLoadingIndicator = NSPredicate { (evaluatedObject, _) in
            guard let element = evaluatedObject as? XCUIElementAttributes else { return false }
            return element.identifier == "In progress" || element.identifier == "Connecting"
        }
        return self.containing(isNetworkLoadingIndicator)
    }

    var deviceStatusBars: XCUIElementQuery {
        let isStatusBar = NSPredicate { (evaluatedObject, _) in
            guard let element = evaluatedObject as? XCUIElementAttributes else { return false }
            return element.elementType == .statusBar
        }
        return self.containing(isStatusBar)
    }
}
