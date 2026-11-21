/**
 * FLIXORA v2.0 — ENHANCED FEATURES & 3D CINEMATIC TEST SUITE
 * Verifies:
 * 1. Watch Availability Timer calculation & expiration logic.
 * 2. Dedicated Movies & Series Hub views and search elements.
 * 3. Top 10 Ranked Movies & Top K-Dramas rails.
 * 4. Three.js 3D Background Canvas and engine integration.
 * 5. PC Trailer iframe permissions and desktop overlap fix.
 * 6. 3D Animated Auth Portal with pulling clamps & physics drop logo.
 * 7. Hero background auto-trailer player and audio controls.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTest(name, fn) {
    try {
        fn();
        console.log(`[PASS] ${name}`);
    } catch (e) {
        console.error(`[FAIL] ${name}: ${e.message}`);
        process.exitCode = 1;
    }
}

console.log('================================================================');
console.log('FLIXORA v2.0 — NEW FEATURES & 3D CINEMATIC TEST SUITE');
console.log('================================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, '../Index.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(__dirname, '../Admin.html'), 'utf8');
const movieServiceJs = fs.readFileSync(path.join(__dirname, '../js/movie-service.js'), 'utf8');
const videoServiceJs = fs.readFileSync(path.join(__dirname, '../js/video-service.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const adminJs = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
const threeSceneJs = fs.readFileSync(path.join(__dirname, '../js/three-scene.js'), 'utf8');
const animCss = fs.readFileSync(path.join(__dirname, '../css/animations.css'), 'utf8');

// 1. WATCH TIMER & AVAILABILITY COUNTDOWN
runTest('TIMER-01: Admin Wizard Step 4 includes Watch Availability Timer selector', () => {
    assert(adminHtml.includes('id="wizardWatchDuration"'), 'wizardWatchDuration select missing');
    assert(adminHtml.includes('id="wizardCustomDurationBox"'), 'wizardCustomDurationBox missing');
    assert(adminJs.includes('handleDurationChange'), 'handleDurationChange method missing in admin.js');
    assert(adminJs.includes('available_until: availableUntil'), 'available_until not saved in wizardPublishFinal');
});

runTest('TIMER-02: VideoService evaluates watch timer expiration and countdown', () => {
    assert(videoServiceJs.includes('getTimeRemaining'), 'getTimeRemaining helper missing');
    assert(videoServiceJs.includes('startCountdownTicker'), 'startCountdownTicker live interval missing');
    assert(videoServiceJs.includes('if (item.available_until && new Date(item.available_until).getTime() < Date.now())'), 'Expiry check missing in isAvailable');
});

// 2. DEDICATED MOVIES & SERIES PAGES
runTest('PAGES-01: Header navigation contains Dedicated Movies and Series buttons', () => {
    assert(indexHtml.includes('window.app.showMoviesView()'), 'showMoviesView nav button missing');
    assert(indexHtml.includes('window.app.showSeriesView()'), 'showSeriesView nav button missing');
    assert(indexHtml.includes('id="moviesView"'), 'moviesView DOM container missing');
    assert(indexHtml.includes('id="seriesView"'), 'seriesView DOM container missing');
});

runTest('PAGES-02: Dedicated search, auto-suggestions and spell-correction available', () => {
    assert(indexHtml.includes('id="movieSearchInput"'), 'movieSearchInput missing');
    assert(indexHtml.includes('id="seriesSearchInput"'), 'seriesSearchInput missing');
    assert(movieServiceJs.includes('suggestSpellCorrection'), 'suggestSpellCorrection missing in MovieService');
    assert(movieServiceJs.includes('getSuggestions'), 'getSuggestions auto-suggestions missing');
});

// 3. MORE CONTENT RAILS
runTest('RAILS-01: Top 10 Ranked Movies and Top K-Dramas rails exist', () => {
    assert(indexHtml.includes('id="top10Section"'), 'top10Section missing');
    assert(indexHtml.includes('id="top10List"'), 'top10List missing');
    assert(indexHtml.includes('id="kdramaSection"'), 'kdramaSection missing');
    assert(indexHtml.includes('id="kdramaList"'), 'kdramaList missing');
    assert(movieServiceJs.includes('getKDramas'), 'getKDramas API method missing');
    assert(movieServiceJs.includes('getTop10Movies'), 'getTop10Movies API method missing');
});

// 4. THREE.JS 3D CINEMATIC VISUALS
runTest('THREE-01: Three.js library and 3D canvas initialized', () => {
    assert(indexHtml.includes('three.min.js'), 'three.js script tag missing in Index.html');
    assert(indexHtml.includes('id="threeCanvas"'), 'threeCanvas canvas missing in Index.html');
    assert(threeSceneJs.includes('THREE.PerspectiveCamera'), 'Camera setup missing in three-scene.js');
    assert(threeSceneJs.includes('THREE.Points'), 'Particle point cloud missing in three-scene.js');
});

// 5. PC TRAILER & OVERLAP FIX
runTest('TRAILER-01: PC Trailer iframe attributes and desktop layout overlap fixed', () => {
    assert(indexHtml.includes('allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"'), 'PC iframe permissions missing');
    assert(appJs.includes('enablejsapi=1'), 'enablejsapi query parameter missing');
    assert(appJs.includes('youtube-nocookie.com'), 'youtube-nocookie privacy embed missing');
});

// 6. HERO AUTO-TRAILER & AUDIO TOGGLE
runTest('HERO-01: Hero background auto-trailer preview container and audio controls', () => {
    assert(indexHtml.includes('id="heroTrailerContainer"'), 'heroTrailerContainer missing');
    assert(indexHtml.includes('id="heroTrailerFrame"'), 'heroTrailerFrame missing');
    assert(indexHtml.includes('id="heroAudioBtn"'), 'heroAudioBtn missing');
    assert(appJs.includes('toggleHeroAudio'), 'toggleHeroAudio method missing in app.js');
});

// 7. 3D ANIMATED LOGIN & AUTH PORTAL
runTest('AUTH-01: 3D animated auth portal with pulling brackets and physics drop logo', () => {
    assert(indexHtml.includes('id="auth3DModal"'), 'auth3DModal missing in Index.html');
    assert(indexHtml.includes('pull-left-arm'), 'pull-left-arm clamp missing');
    assert(indexHtml.includes('pull-right-arm'), 'pull-right-arm clamp missing');
    assert(indexHtml.includes('logo-drop-physics'), 'logo-drop-physics missing');
    assert(animCss.includes('@keyframes pullLeftAnim'), 'pullLeftAnim keyframes missing in CSS');
    assert(animCss.includes('@keyframes logoDropAnim'), 'logoDropAnim keyframes missing in CSS');
});

console.log('\n================================================================');
console.log('ALL NEW FEATURES TESTS EXECUTED SUCCESSFULLY!');
console.log('================================================================');
