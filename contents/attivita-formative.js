/**
 * Visualizzazione avanzata della pagina "Attività formative"
 */

const BASE_COLS = {
    CodIns: 'Cod Ins.',
    Ore: 'Ore',
    OreRiconosciute: 'Ore riconosciute',
    // Voto: 'Voto',
    CoeffVoto: 'Coeff. voto',
    TipoEsame: 'Tipo form.',
    LivelloEsame: 'Liv. Esame',
    Punti: 'Punti'
};

const COLS = {
    ...BASE_COLS,
    PhdCourse: 'PhD Course'
};

const EXT_COLS = {
    ...COLS
}

const LIVS2COEF = {"3": 1, "2": 1 / 2, "1": 1 / 3}
const STDCOEFVOTO = 4 / 3

const BUCKETS = {
    AllPassed: (course) => course.Punti > 0,
    SoftPassed: (course) => course.TipoEsame === 'Soft' && course.Punti > 0,
    HardPassed: (course) => course.TipoEsame === 'Hard' && course.Punti > 0,
    HardDigepPassed: (course) => course.TipoEsame === 'Hard' && course.PhdCourse === 'Gestione, produzione e design' && course.Punti > 0,

    All: (course) => true,
    Soft: (course) => course.TipoEsame === 'Soft',
    Hard: (course) => course.TipoEsame === 'Hard',
    HardDigep: (course) => course.TipoEsame === 'Hard' && course.PhdCourse === 'Gestione, produzione e design'
}

function setSyncMessage(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, resolve)
    })
}

function makeClass(col) {
    return 'class-'+Object
        .entries(EXT_COLS)
        .find(([k, v]) => v === col)[0]
}

document.body.insertAdjacentHTML('beforebegin', `
    <style>
    #ecrus_summary_tb table {border-collapse: collapse;}
    #ecrus_summary_tb table td {border: 1px solid black; padding: 3px 10px 3px 10px;}
    #tabellaStudenti tr:hover td {background-color: #daf0ff !important;}
    input[type='checkbox'] {cursor: pointer;}
    tbody tr td:nth-child(n+5), #ecrus_summary_tb table td {text-align: right; font-family: monospace;}
    tbody tr td:nth-child(-n+4) {text-align: left; font-family: monospace;}
    </style>
 `)

const SCUDO_COURSES = setSyncMessage({type: 'SCUDO_COURSES'})

async function main() {
    // parsa la tabella principale con la didattica
    const tabellaStudenti =
        await waitForElement("#tabellaStudenti");

    // const scudoDataPromise = chrome.storage.session.get(["SCUDO_DATA"])();

    let tabellaStudentiHeadersText =
        [...tabellaStudenti.querySelectorAll("thead tr th")]
            .map(th => th.innerText);
    // assert che tutti i campi esistano
    Object.values(BASE_COLS).forEach(expectedColumn => {
        if (!tabellaStudentiHeadersText.includes(expectedColumn))
            throw `La colonna attesa ${expectedColumn} è assente.`
    });
    // assert che il codice esame sia il primo campo
    if (tabellaStudentiHeadersText[0] !== BASE_COLS.CodIns)
        throw `La colonna attesa ${BASE_COLS.CodIns} non è in prima posizione.`

    // wait for page load
    const _ = await waitForElement('tbody tr.even td');

    const tableRows = [...tabellaStudenti
        .querySelectorAll('tbody tr')]

    // funzione di calcolo, viene eseguita ad ogni check
    const enrichPanel = () => {
        const parsedExams = tableRows
            .filter(tableRow => tableRow.querySelector("input[type='checkbox']").checked)
            .map(tableRow => {
                const cols = [...tableRow.querySelectorAll('td')]
                return Object.fromEntries(Object.entries(COLS).map(([k, v]) => {
                    return [k, cols[colIndex[k]].innerText]
                }))
            })
            .map(addIndicators)

        const buckets = bucketize(parsedExams);
        makeSummaryTable(buckets);
    }

    // aggiunge la checkbox
    tabellaStudenti
        .querySelector('thead tr th:first-child')
        .insertAdjacentHTML("beforebegin", `<th>&nbsp;</th><th>${COLS.PhdCourse}</th>`);

    // rimuove le larghezze colonne fisse
    [...tabellaStudenti
        .querySelectorAll('thead tr th')]
        .forEach(th => {
            th.setAttribute('style', undefined)
        });

    const scudoCourses = await SCUDO_COURSES
    tableRows
        .forEach(examRow => {
            const examCodeCell = examRow.children[0]
            const examCode = examCodeCell.innerText
            examRow.insertBefore(
                createExamCheckboxTd(examCode, examRow, enrichPanel), examCodeCell)

            const phdCourse = scudoCourses[examCode]?.cds || '';
            examCodeCell.insertAdjacentHTML("beforebegin",
                `<td>${phdCourse}</td>`)
        });

    // Update headers after enrich
    tabellaStudentiHeadersText =
        [...tabellaStudenti.querySelectorAll("thead tr th")]
            .map(th => th.innerText);

    // make index. Es: colIndex[COLS.Ore]
    const colIndex = Object.fromEntries(Object.entries(COLS).map(([k, v]) => [
        k, tabellaStudentiHeadersText.findIndex(h => h === v) // refers to TD OBJ not value, no padding becouse is BEFORE add new td
    ]))

    enrichPanel();
}

document
    .querySelector('.panel-body div.row:nth-child(2)')
    .insertAdjacentHTML("afterend", `
        <div class="row">
            <div class="col-sm-12">
                <div id="ecrus_summary_tb"><b>Enhanced CRUscotto Scudo Loading...</b></div>
            </div>
        </div>
    `)

function makeSummaryTable(buckets) {
    document
        .querySelector('#ecrus_summary_tb')
        .innerHTML = `
            <table>
            <tr>
                <td>&nbsp;</td>
                <td>All (got)</td><td>Soft (Got)</td><td>Hard (Got)</td><td>Hard DIGEP (Got)</td>
                <td>All</td><td>Soft</td><td>Hard</td><td>Hard DIGEP</td>
            </tr>
            <tr>
                <td>D</td>
                <td>${buckets.AllPassed.D}</td><td>${buckets.SoftPassed.D}</td><td>${buckets.HardPassed.D}</td><td>${buckets.HardDigepPassed.D}</td>
                <td>${buckets.All.D}</td><td>${buckets.Soft.D}</td><td>${buckets.Hard.D}</td><td>${buckets.HardDigep.D}</td>
            </tr>
            <tr>
                <td>H</td>
                <td>${buckets.AllPassed.H}</td><td>${buckets.SoftPassed.H}</td><td>${buckets.HardPassed.H}</td><td>${buckets.HardDigepPassed.H}</td>
                <td>${buckets.All.H}</td><td>${buckets.Soft.H}</td><td>${buckets.Hard.H}</td><td>${buckets.HardDigep.H}</td>
            </tr>
            </table>
        `
}

function bucketize(parsedExams) {
    return Object
        .fromEntries(Object.entries(BUCKETS).map(([bucket, bucketFilterFn]) => {
            let H = 0;
            let D = 0;
            parsedExams
                .filter(bucketFilterFn)
                .forEach(parsedExam => {
                    H += parsedExam.H
                    D += parsedExam.D
                })
            return [bucket, {D: D.toFixed(2), H: H.toFixed(2)}]
        }))
}

function addIndicators(parsedExam) {
    let coeffVoto = parseFloat(parsedExam.CoeffVoto)
    const oreRiconosciute = parseFloat(parsedExam.OreRiconosciute)
    const punti = parseFloat(parsedExam.Punti)

    const coeffLivello = LIVS2COEF[parsedExam.LivelloEsame]

    if (isNaN(coeffVoto))
        coeffVoto = STDCOEFVOTO

    const Dreal = punti;
    const H = oreRiconosciute * coeffLivello
    const Dpox = H * coeffVoto

    if (!isNaN(punti))
        if (Math.abs(Dpox - Dreal) > 0.1) {
            throw `Calcolo errato. Atteso ${Dreal} ma ottiene ${Dpox}`
        }

    return {...parsedExam, H, D: Dreal || Dpox}
}


function onEcrusCheckboxChange(key, checked, examRow, enrichPanel) {
    localStorage.setItem(key, checked);
    enrichPanel();

    // const className = 'ecrus_checked';
    // checked ?
    //     examRow.classList.add(className) :
    //     examRow.classList.remove(className);
}

function createExamCheckboxTd(examCode, examRow, enrichPanel) {
    const key = `ecrus_examCode_${examCode}`
    const checked = localStorage.getItem(key) === 'true' || false;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.addEventListener('change',
        e => onEcrusCheckboxChange(key, e.target.checked, examRow, enrichPanel));

    const td = document.createElement('td')
    td.appendChild(checkbox)
    return td
}

main()
    .then()
    .catch(err => console.error(err))

/**
 * Utils
 */

function waitForElement(selector) {
    // from https://stackoverflow.com/a/61511955/11751908
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}




