
// SCUDO_DATA = fetch("http://dottorato.polito.it/zxd/b5eda0a74558a342cf659187f06f746f/91ce2c3036dfafbabde88e880869ed9z/", {mode: 'no-cors'})
//   .then(response => response.json())

let cacheTime = undefined;

const SCUDO_COURSES = fetch("http://dottorato.polito.it/zxd/b5eda0a74558a342cf659187f06f746f/91ce2c3036dfafbabde88e880869ed9z/", {mode: 'no-cors'})
    .then(response => response.json())
    .then(parseScudoCourses)
    .then(json => {
        cacheTime = new Date();
        return json
    })

// background script
chrome.runtime.onMessage.addListener(function (message, sender, senderResponse) {
    if (message.type === "SCUDO_COURSES") {
        SCUDO_COURSES
            .then(json => senderResponse(json))
    }
    return true
});

function parseScudoCourses(json) {
    return Object.fromEntries(
        json.lastCyclePhds.flatMap(({title: cds, cds: cdsId, courses}) => {
            return courses.map(({code, course, hours}) => {
                return [code, {code, cdsId, cds, course, hours}]
            })
        }))
}

//
// const SCUDO_DATA =
//     fetch("http://dottorato.polito.it/zxd/b5eda0a74558a342cf659187f06f746f/91ce2c3036dfafbabde88e880869ed9z/", {mode: 'no-cors'})
//         .then(response => response.json())
//         .catch(x => console.error(x))
//
// chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });
// chrome.storage.session.set({ "SCUDO_DATA": SCUDO_DATA })
//     .finally()

// SCUDO_DATA
//     .then(json => {
//         chrome.storage.sync.set({'SCUDO_DATA': json}, function() {
//             console.log('Settings saved');
//         });
//     })
//     .catch(err => console.log(err))
//
// console.log("Ok from BG")