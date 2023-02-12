function runOnLoadAnim() {
    setTimeout(()=> {
        document.querySelectorAll('[data-onload-anim="true"]').forEach(el => {
            el.classList.remove('hide');
        });
    }, 1);
}
function documentReady() {
    runOnLoadAnim();
}

document.addEventListener("DOMContentLoaded", documentReady);