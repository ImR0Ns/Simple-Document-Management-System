$(document).ready(()=>{
    //for scroll
    window.addEventListener("scroll", (event) => {
        let scroll = this.scrollY;
        if (scroll > 10) {
          document.querySelector(".header-wrapper").classList.add("shadow");
        } else {
          document.querySelector(".header-wrapper").classList.remove("shadow");
        }
    });
})
