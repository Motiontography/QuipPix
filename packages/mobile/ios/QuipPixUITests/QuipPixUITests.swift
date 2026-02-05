import XCTest

@MainActor
final class QuipPixUITests: XCTestCase {

    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        setupSnapshot(app)
        app.launch()
    }

    /// Find a tappable element by its label text across all element types.
    /// React Navigation renders custom tab bars with React Native views,
    /// not native UITabBar, so we must search the full element tree.
    private func findElement(label: String, timeout: TimeInterval = 10) -> XCUIElement? {
        let predicate = NSPredicate(format: "label BEGINSWITH %@", label)
        let element = app.descendants(matching: .any).matching(predicate).firstMatch
        return element.waitForExistence(timeout: timeout) ? element : nil
    }

    func testScreenshots() throws {
        // Wait for the app to load (either onboarding or main tabs)
        sleep(5)

        // Dismiss onboarding if shown — the Skip button has testID="skip-onboarding"
        // which maps to accessibilityIdentifier on iOS.
        let skipById = app.descendants(matching: .any)["skip-onboarding"]
        if skipById.waitForExistence(timeout: 10) {
            skipById.tap()
            sleep(3)
        }

        // Wait for the Home tab label to appear (React Navigation custom tab bar)
        _ = findElement(label: "Home", timeout: 15)
        sleep(2)

        // 1. Home Screen
        snapshot("01_HomeScreen")

        // 2. Gallery Tab
        if let gallery = findElement(label: "Gallery", timeout: 5) {
            gallery.tap()
            sleep(2)
            snapshot("02_GalleryScreen")
        }

        // 3. Challenges Tab
        if let challenges = findElement(label: "Challenges", timeout: 5) {
            challenges.tap()
            sleep(2)
            snapshot("03_ChallengesScreen")
        }

        // 4. Settings Tab
        if let settings = findElement(label: "Settings", timeout: 5) {
            settings.tap()
            sleep(2)
            snapshot("04_SettingsScreen")
        }

        // Return to Home
        if let home = findElement(label: "Home", timeout: 5) {
            home.tap()
            sleep(1)
        }
    }
}
