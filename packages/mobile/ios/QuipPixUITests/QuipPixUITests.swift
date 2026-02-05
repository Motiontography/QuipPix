import XCTest

class QuipPixUITests: XCTestCase {

    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        setupSnapshot(app)
        app.launch()
    }

    // MARK: - App Store Screenshots
    //
    // Captures 6 screenshots across key screens.
    // The flow navigates tab-by-tab rather than through the full
    // generation pipeline, since generation requires a real API call.

    func testScreenshots() {
        // 1. Home screen — shows Choose Photo / Take Photo buttons
        sleep(3)
        snapshot("01_HomeScreen")

        // 2. Style picker — tap "Choose Photo", pick an image, land on StyleSelect
        let choosePhoto = app.buttons["Choose Photo"]
        if choosePhoto.waitForExistence(timeout: 5) {
            choosePhoto.tap()
            sleep(2)

            // Tap the first image in the photo picker
            let firstPhoto = app.images.firstMatch
            if firstPhoto.waitForExistence(timeout: 5) {
                firstPhoto.tap()
                sleep(2)
            }

            snapshot("02_StylePicker")

            // 3. Style customization — tap a style card to open preview
            let styleCard = app.buttons.matching(
                NSPredicate(format: "label CONTAINS[c] 'style'")
            ).firstMatch
            if styleCard.waitForExistence(timeout: 5) {
                styleCard.tap()
                sleep(1)

                // Tap "Use This Style" to go to Customize screen
                let useStyle = app.buttons["Use This Style"]
                if useStyle.waitForExistence(timeout: 3) {
                    useStyle.tap()
                    sleep(2)
                    snapshot("03_Customize")
                }
            }

            // Navigate back to tabs for remaining screenshots
            let backButton = app.buttons["Go back"]
            if backButton.waitForExistence(timeout: 3) {
                backButton.tap()
                sleep(1)
            }
        }

        // 4. Challenges screen
        let challengeTab = app.tabBars.buttons["Challenges"]
        if challengeTab.waitForExistence(timeout: 5) {
            challengeTab.tap()
            sleep(2)
            snapshot("04_Challenges")
        }

        // 5. Gallery screen
        let galleryTab = app.tabBars.buttons["Gallery"]
        if galleryTab.waitForExistence(timeout: 5) {
            galleryTab.tap()
            sleep(2)
            snapshot("05_Gallery")
        }

        // 6. Settings screen — navigate to Paywall
        let settingsTab = app.tabBars.buttons["Settings"]
        if settingsTab.waitForExistence(timeout: 5) {
            settingsTab.tap()
            sleep(1)

            let upgradePro = app.buttons["Upgrade to Pro"]
            if upgradePro.waitForExistence(timeout: 3) {
                upgradePro.tap()
                sleep(2)
                snapshot("06_ProUpgrade")
            }
        }
    }
}
