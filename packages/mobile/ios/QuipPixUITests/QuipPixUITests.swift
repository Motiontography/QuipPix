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

    func testScreenshots() {
        // 1. Home / Gallery screen
        sleep(3) // Wait for app to fully load
        snapshot("01_HomeScreen")

        // 2. Style picker — tap the generate/create button
        //    Update the accessibility identifier or button label to match your app
        let createButton = app.buttons["Create"].firstMatch
        if createButton.waitForExistence(timeout: 5) {
            createButton.tap()
            sleep(2)
            snapshot("02_StylePicker")
        }

        // 3. Style customization — tap a style card
        let firstStyle = app.cells.firstMatch
        if firstStyle.waitForExistence(timeout: 5) {
            firstStyle.tap()
            sleep(2)
            snapshot("03_StyleCustomization")
        }

        // 4. Generation result — wait for result to appear
        //    This may need adjustment based on your actual UI
        let resultImage = app.images["ResultImage"].firstMatch
        if resultImage.waitForExistence(timeout: 30) {
            snapshot("04_Result")
        }

        // 5. Challenges screen
        let challengeTab = app.buttons["Challenges"].firstMatch
        if challengeTab.waitForExistence(timeout: 5) {
            challengeTab.tap()
            sleep(2)
            snapshot("05_Challenges")
        }

        // 6. Pro upgrade screen
        let proButton = app.buttons["Pro"].firstMatch
        if proButton.waitForExistence(timeout: 5) {
            proButton.tap()
            sleep(2)
            snapshot("06_ProUpgrade")
        }
    }
}
