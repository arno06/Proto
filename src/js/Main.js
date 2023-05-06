(function(){

    let clone = null;

    function init(){
        new InventoryHandler();
    }

    class InventoryHandler{
        constructor() {
            this.clone = null;
            document.querySelectorAll('[draggable="true"]').forEach((e)=>{
                e.addEventListener('dragstart', this.startDragHandler.bind(this));
                e.addEventListener('dragend', this.stopDragHandler.bind(this));
            });

            document.querySelectorAll('[data-drop]').forEach(this.registerDroppable.bind(this));
        }

        registerDroppable(pEl){
            pEl.addEventListener('drop', this.dropHandler.bind(this));
            pEl.addEventListener('dragover', this.dragOverHandler.bind(this));
            pEl.addEventListener('dragleave', this.dragLeaveHandler.bind(this));
        }


        stopDragHandler(e){
            document.querySelectorAll('[data-drop]').forEach((e)=>{
                e.classList.remove('droppable');
            });
            this.clone = null;
        }

        startDragHandler(e){
            document.querySelectorAll('[data-drop]').forEach((e)=>{
                e.classList.add('droppable');
            });
            this.clone = e.currentTarget.cloneNode(true);
            this.clone.removeAttribute('draggable');
            e.dataTransfer.setData('x', e.offsetX);
            e.dataTransfer.setData('y', e.offsetY);

        }

        dropHandler(e){
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.clone.style.left = (e.layerX-Number(e.dataTransfer.getData('x')))+"px";
            this.clone.style.top = (e.layerY-Number(e.dataTransfer.getData('y')))+"px";
            e.currentTarget.appendChild(this.clone);
            if(this.clone.classList.contains('block')){
                this.registerDroppable(this.clone);
            }
            new EditableElement(this.clone);
            this.clone = null;

        }

        dragOverHandler(e){
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            e.currentTarget.classList.add('dragover');
        }

        dragLeaveHandler(e){
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
        }
    }

    class EditableElement{
        constructor(pElement){
            this.magnet_treshold = 5;
            this.guides = [];
            this.domElement = pElement;
            this.domElement.classList.add('element');
            this._mouseMovehandler = this.mouseMoveHandler.bind(this);
            this._mouseUpHandler = this.mouseUpHandler.bind(this);
            this.domElement.addEventListener('mousedown', this.mouseDownHandler.bind(this));
        }

        mouseDownHandler(e){
            this.ref = {x:e.layerX, y:e.layerY};
            let rect = this.domElement.getBoundingClientRect();
            let withinMoveZone = (this.ref.x < (rect.width - 10))&&(this.ref.y < (rect.height - 10));
            e.stopImmediatePropagation();
            e.stopPropagation();
            if(!withinMoveZone){
                return;
            }
            document.addEventListener('mousemove', this._mouseMovehandler);
            document.addEventListener('mouseup', this._mouseUpHandler);

            this.domElement.parentNode.querySelectorAll(':scope>.element').forEach((elt)=>{
                if(elt === this.domElement){
                    return;
                }
                let s = document.defaultView.getComputedStyle(elt, null);
                this.createGuide({left:Number(s.left.replace("px", ""))});
                this.createGuide({top:Number(s.top.replace("px", ""))});
                this.createGuide({left:(elt.offsetWidth+Number(s.left.replace("px", "")))});
                this.createGuide({top:(elt.offsetHeight+Number(s.top.replace("px", "")))});

            });
        }

        createGuide(pStyle){
            this.guides.push(pStyle);
            let d = document.createElement('div');
            d.classList.add('guide');
            this.domElement.parentNode.appendChild(d);
            if(pStyle.top){
                d.style.width = "100%";
                d.style.height = "1px";
                d.style.left = "0";
            }
            for(let k in pStyle){
                if(!pStyle.hasOwnProperty(k)){
                    continue;
                }
                d.style[k] = pStyle[k]+"px";
            }
        }

        mouseMoveHandler(e){
            let parentRect = this.domElement.parentNode.getBoundingClientRect();
            let rect = this.domElement.getBoundingClientRect();
            let val = {
                x:((e.pageX - parentRect.x) - this.ref.x),
                y:((e.pageY - parentRect.y) - this.ref.y)
            }
            val.x = Math.max(val.x, 0);
            val.y = Math.max(val.y, 0);
            val.x = Math.min(val.x, parentRect.width - this.domElement.getBoundingClientRect().width);
            this.guides.forEach((g)=>{
                if(g.left){
                    val.x = this.deductConstraint(g.left, val.x, this.domElement.offsetWidth);
                }
                if(g.top){
                    val.y = this.deductConstraint(g.top, val.y, this.domElement.offsetHeight);
                }
            });
            this.domElement.style.left = Math.round(val.x)+"px";
            this.domElement.style.top = Math.round(val.y)+"px";
        }

        deductConstraint(pProp, pVal, pSizeVal){
            if((pVal < (pProp+this.magnet_treshold)) && (pVal > (pProp-this.magnet_treshold))){
                return pProp;
            }
            if((pVal + pSizeVal) < (pProp + this.magnet_treshold) && (pVal + pSizeVal)>(pProp-this.magnet_treshold)){
                return pProp - pSizeVal;
            }
            return pVal;
        }

        mouseUpHandler(e){
            e.preventDefault();
            document.removeEventListener('mousemove', this._mouseMovehandler);
            document.removeEventListener('mouseup', this._mouseUpHandler);
            this.domElement.parentNode.querySelectorAll('.guide').forEach((elt)=>{
                elt.remove();
            });
            this.guides = [];
        }
    }

    window.addEventListener('DOMContentLoaded', init);
})();