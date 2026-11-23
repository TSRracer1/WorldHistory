// swift-tools-version: 5.9
// Powder Keg for iPhone and iPad. Open this folder in Swift Playgrounds (iPad or Mac) or in Xcode and press Run.
import PackageDescription
import AppleProductTypes

let package = Package(
    name: "PowderKeg",
    platforms: [.iOS("16.0")],
    products: [
        .iOSApplication(
            name: "Powder Keg",
            targets: ["AppModule"],
            bundleIdentifier: "com.example.powderkeg",
            teamIdentifier: "",
            displayVersion: "1.0",
            bundleVersion: "1",
            appIcon: .placeholder(icon: .gameController),
            accentColor: .presetColor(.brown),
            supportedDeviceFamilies: [.pad, .phone],
            supportedInterfaceOrientations: [.landscapeRight, .landscapeLeft, .portrait, .portraitUpsideDown(.when(deviceFamilies: [.pad]))]
        )
    ],
    targets: [
        .executableTarget(name: "AppModule", path: ".", exclude: ["README.txt"], resources: [.copy("Resources")])
    ]
)
