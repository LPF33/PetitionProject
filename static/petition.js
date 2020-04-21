(function(){
    const canvas = document.getElementById("signature");

    if(!canvas){
        return;
    }
    
    const ctx = canvas.getContext("2d");

    let startPointX;
    let startPointY;

    const drawstart = (e) => {
        startPointX = e.offsetX;
        startPointY = e.offsetY;
        canvas.addEventListener("mousemove", draw) 
    }

    const draw = (e) => {
        ctx.beginPath();
        ctx.moveTo(startPointX,startPointY);
        ctx.lineTo(e.offsetX,e.offsetY);
        ctx.closePath();
        ctx.stroke();    
        startPointX = e.offsetX;
        startPointY = e.offsetY;         
    }

    const drawend = () => {
        canvas.removeEventListener("mousemove", draw) 
        document.getElementById("signaturecode").value = canvas.toDataURL();
    }


    canvas.addEventListener("mousedown", drawstart);   
    canvas.addEventListener("mouseup", drawend);
})();