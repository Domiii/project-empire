## 緊急的事情
* data by cohort
* user registration with cohort consideration
* make relationships work
* clean up the TODO lists!

* titles for session
    * add session title to video title
        * possibly remove original "presentation title
* start doing those playlists

* presentationStatus gets overridden when explicitely starting the "preparing" presentation
* when fileId has been set before, "startPresentationSessionStreamRecording" causes problems:
      set_streamFileId(streamArgs, presentationId),
      set_presentationFileId({ presentationId }, presentationId),
* Space: no errors shown when trying to save and out of space (or in general when writing blobs)
    * need a space indicator in the operator view
* Show connection status in live session?
* Operator/presenter should have it easier to double check user name + title?

* user operator & new user access privileges
* creating new presentations from list of previous session
* evaluations, note taking, tracking "projects" (or "teams"?)
* multiple cohorts!!!
* when user logs in sees self highlighted in list
    * also sees warning + estimated time in "live session" header

* More explicitely enable the different debug switches?
    * Any writer call
    * Any Load/Unload
    * Any change to data
    * etc...

## TODO: External Camera
* webcam @ 720p is still really bad quality (especially in room that is not very well lit)
* "Currently, people who want to do Video Conferencing with 'non-webcam' cameras, (internal/USB HDMI capture cards) are forced to use Xsplit to setup their video source, then Skype or Zoom will 'see' Xsplit as an available webcam input."
* Try Webcamoid for Windows first - https://webcamoid.github.io/#downloads
  * virtual camera support: https://github.com/webcamoid/webcamoid/wiki/Virtual-camera-support
* [Expensive; Windows only] SparkoCam Virtual Webcam: https://sparkosoft.com/how-to-use-dslr-as-webcam

## TODO: Basics
* Basic user management
    * Add new option: auto-registering of new users can be turned on + off (for short periods of time)
        * -> Turn on next Friday
        * annoying to test this -> consider doing some automated testing here
    * presentation <-> user name matching
      -> match user name to actual (but unregistered) user via admin interface
    * User table
      -> show all info
    * Easily edit all info
    * Easily approve all (and/or individual) unregistered users

* many2many relationships
    * for all deletes: add an optional batchUpdate parameter
      * delete calls that did not receive it, create one themselves
        * and flush it at the end of their call
          
* 讓 user 提供　檔案　連結
    * make sessions viewable by normal users
    * Match user ids to presentation
        * match by fullName and add stronger user editing features
    * New screen for users to see and edit their own presentations
        * Button to quickly edit their stuff from the PresentationView


* External mic support
    * 沒有麥克風的時候，要收動叫系統切換 audio input
    * can I detect when a multimedia device is gone?
        * or poll continuously?
    * change to default when gone
        * restore when available again?

* be able to keep writing file, option not to override
* button to shuffle PENDING presentations
* import + ready up this week's presentation list!
    * account for every single user!

* non-admin [O]perator
    * new database write rules
        * change all (most) rules to use displayRole instead of role, so it's more accurate when testing
    * dropdown component to let admin set operator [OperatorSelection]
    * be able to observe more detailed [O]peration info online (so we can watch non-admin operator)
    * test with non-admin account

* generate per session playlists
    * edit + view session title

* [N, O, (E)] network-enabled presentation timer!
    -> https://firebase.google.com/docs/database/web/offline-capabilities#server-timestamps
    ->  var offsetRef = firebase.database().ref(".info/serverTimeOffset");
        offsetRef.on("value", function(snap) {
          var offset = snap.val();
          var estimatedServerTimeMs = new Date().getTime() + offset;
        });

* show user last login time

* generate per user playlists

* proper project + user tagging for presentations

* project management
    -> account for every active project
      -> possibly get a status update for each presentation that has a project in its focus
    -> archive/unarchive projects
    -> start new project based on presentation

  -> generate presentation list for new session
    -> ideally based on all currently active projects + any individual user who does not have a project
    -> (possibly cycle based?)

  -> generate per project playlists
  
  -> fix layout for [O]perator to prevent elements from moving around (disabled/invisible, not hidden!)

## Bugs
* Last finished entry in presentation table is in the wrong part of table ("pending")
    * Should not be able to edit multiple rows at a time (one per table split).
* things get messed up when the order is distorted during recording?
    * first video somehow got overwritten... when someone changed order at around the same time as recording started

## TODO: Advanced
* Proper testing setup
    * https://medium.com/welldone-software/an-overview-of-javascript-testing-in-2018-f68950900bc3

* 讓他們上傳他們的簡報
* 提出問題／提示給他們 (notifications)
* 客觀的寶寶村制度？？？
  -> Improved presentation mode
    -> [N] Who is up?
    -> [N] Who is next?
  -> let non-dev users easily manage + delete files
  -> automatic audio noise + volume adjustment?

  -> [E] inline editing
  
  -> features for normal users:
      -> presentation session + presentation
      -> own + participating playlists
      -> see + review feedback
      -> give/edit/evaluate feedback
      -> project view
      -> let users provider supplementary material (at least presentation URL)
 
* Volume indicator: 
    * https://github.com/webrtc/samples/blob/gh-pages/src/content/getusermedia/volume/js/soundmeter.js
    * https://github.com/cwilso/volume-meter/blob/master/volume-meter.js
* Screen recording
    * (be able to record projector output as well as the speaker)
    * https://github.com/muaz-khan/RecordRTC/blob/master/simple-demos/video-plus-screen-recording.html
* Recording should be possible even when the internet is cut off.

## TODO: Cohorts

* Split all data into two: Global data and per-cohort data
* Have one DataSourceProvider each
* User data will be global
  * UserModel must provide list of per-cohort uids
  * all (ccurent) user queries should still work but internally make use of the cohort-level of indirection to get it's data
  * PROBLEM: Relationships cannot traverse trees
  * PROBLEM: DataProvider cannot concurrently provide multiple trees


# Neat little insights + gists

* Correct line numbers in React render errors:
    * https://github.com/facebook/react/issues/6062#issuecomment-256641386
* [Example] Working with `fetch` + `StreamReader`: `fetch('localhost').then(res => res.body.getReader().read().then(({ done, value }) => console.log(new TextDecoder("utf-8").decode(value))));`


# Add professional camera as webcam

* https://www.knowrick.com/blog/how-to-setup-canon-dslr-t3i-as-a-webcam-on-mac
    * Use Cam Twist (works on Mac + Windows)
* This guy converts HDMI to USB: https://ozar.me/2014/03/using-hd-camcorder-mac-webcam/
    * (but apparently the converter is super expensive??)



# Troubleshooting

* npm install fails on Windows: "Error: EPERM: operation not permitted...
    * https://github.com/npm/npm/issues/10826
    * `npm config edit`
    * `cache-lock-retries=1000`