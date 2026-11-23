POWDER KEG: XCODE PROJECT

Open PowderKeg.xcodeproj in Xcode 15 or later.

To run it on your iPhone or iPad
  1. Click "PowderKeg" at the top of the left sidebar, then the PowderKeg target, then "Signing & Capabilities".
  2. Tick "Automatically manage signing" and choose your Apple ID under Team.
  3. Change the Bundle Identifier to one of your own, for example com.yourname.powderkeg.
  4. Plug in the device, pick it in the bar at the top, and press Run.
  With a free Apple ID the app has to be re-installed every seven days.

To try it without signing, pick any iPhone simulator instead of a device.

If signing fails with "resource fork, Finder information, or similar detritus not allowed",
move this folder out of Desktop, Documents or Downloads (iCloud adds hidden data to files there),
run  xattr -cr  on the folder in Terminal, then Product > Clean Build Folder.

The game is PowderKeg/index.html. Replacing that file updates the game.
