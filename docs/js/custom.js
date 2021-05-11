// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollTopButton()};

function scrollTopButton() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    document.getElementById("goTopBtn").style.display = "block";
  } else {
    document.getElementById("goTopBtn").style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function scrollTop1() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

//Smooth scroll to the top of the document
function smoothScrollTop(){
    var timer  = null;
    cancelAnimationFrame(timer);
    timer = requestAnimationFrame(function fn(){
        var oTop = document.body.scrollTop || document.documentElement.scrollTop;
        if(oTop > 0){
            document.body.scrollTop = document.documentElement.scrollTop = oTop *0.90;
            timer = requestAnimationFrame(fn);
        }else{
            cancelAnimationFrame(timer);
        }
    });
}