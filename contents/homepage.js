/**
 * Visualizzazione avanzata della pagina "Attività formative"
 */

function main() {
    // parsa la tabella principale con la didattica
    const menuAltoPrincipale =
        document.querySelector("ul#menu_pag_stud")

    const nuovoElementoLi = document.createElement("li");
    nuovoElementoLi.innerHTML = "<a href='/pls/portal30/sviluppo.crudo.login'>Cruscotto ScuDo</a>";

    const cruscottoScudoPattern = /^https:\/\/sid\.polito\.it\/scudo\/online.*/;
    if (cruscottoScudoPattern.test(window.location.href)) {
        nuovoElementoLi.classList.add('active')
        menuAltoPrincipale.children[1].classList.remove('active')
    }

    // inserisce in terza posizione
    menuAltoPrincipale
        .insertBefore(nuovoElementoLi, menuAltoPrincipale.children[2]);

}

main()