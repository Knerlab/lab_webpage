let scrollContainer = document.querySelector(".gallery");
let backBtn = document.getElementById("backBtn")
let nextBtn = document.getElementById("nextBtn")

if (scrollContainer) {
scrollContainer.addEventListener("wheel",(evt)=> {
    evt.preventDefault();
    scrollContainer.scrollLeft += evt.deltaY;
});
}

backBtn.addEventListener("click",()=>{
    scrollContainer.style.scrollBehavior = "smooth";
    scrollContainer.scrollLeft -= 310;
});
nextBtn.addEventListener("click",()=>{
    scrollContainer.style.scrollBehavior = "smooth";
    scrollContainer.scrollLeft += 310;
});