(function(){

    const inputs = {
        'width':{
            'label':'Largeur',
            'nodeName':'input',
            'attributes':{
                'type':'text'
            },
            'valAttr':'value',
            'getValue':(pEl, pSelected)=>{pEl.value = pSelected.offsetWidth;}
        },
        'height':{
            'label':'Hauteur',
            'nodeName':'input',
            'attributes':{
                'type':'text'
            },
            'getValue':(pEl, pSelected)=>{pEl.value = pSelected.offsetHeight;}
        },
        'font':{
            'label':'Police',
            'nodeName':'select',
            'attributes':{
                'innerHTML':'<option value="Arial, sans-serif">Sans-sérif</option><option value="Times, serif">Sérif</option>'
            },
            'getValue':(pEl, pSelected)=>{

            }
        },
        'fontsize':{
            'label':'Taille de police',
            'nodeName':'select',
            'attributes':{
                'innerHTML':'<option value="10px">Petite</option><option value="14px">Moyenne</option><option value="18px">Grande</option>'
            },
            'getValue':(pEl, pSelected)=>{

            }
        },
        'content':{
            'label':'Texte',
            'nodeName':'textarea',
            'getValue':(pEl, pSelected)=>{pEl.innerHTML = pSelected.innerHTML;}
        },
        'delete':{
            'nodeName':'button',
            'attributes':{
                'innerHTML':'Supprimer',
                'class':'delete',
                'onclick':()=>{
                    selectedElement.remove();
                    unselect();
                    return false;
                }
            },
        }
    };

    const props = {
        'block':['width', 'height', 'delete'],
        'text':['width', 'height', 'content', 'font', 'fontsize', 'delete'],
        'img':['width', 'height', 'delete'],
        'input':['width', 'height', 'content', 'delete'],
        'button':['width', 'height', 'content', 'delete']
    };

    let clone = null;
    let selectedElement = null;

    function init(){
        new InventoryHandler();
        document.addEventListener('select', blockSelectedHandler);
    }

    function blockSelectedHandler(e){
        selectedElement = e.detail.element;
        const type = e.detail.element.dataset.type;
        document.querySelector('.editor .name').innerHTML = type;

        const form = document.querySelector('.editor form');
        form.innerHTML = '';

        if(!props[type]){
            console.log("Type non décrit "+type);
            return;
        }

        props[type].forEach((pInput)=>{
            if(!inputs[pInput]){
                console.log("Input non décrit "+pInput);
                return
            }
            let input = inputs[pInput];
            const d = document.createElement('div');

            if(input.label){
                const label = document.createElement('span');
                label.innerHTML = input.label+' : ';
                d.appendChild(label);
            }

            const inp = document.createElement(input.nodeName);
            for(let i in input.attributes){
                if(!input.attributes.hasOwnProperty(i)){
                    continue;
                }
                inp[i] = input.attributes[i];
            }
            if(input.getValue){
                input.getValue(inp, selectedElement);
            }
            d.appendChild(inp);

            form.appendChild(d);
        });
    }

    function unselect(){
        document.querySelector('.editor .name').innerHTML = '';
        document.querySelector('.editor form').innerHTML = '';
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
            this.domElement.dataset.type = pElement.className;
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
                this.domElement.classList.remove("selected");
                return;
            }
            document.querySelectorAll(".element.selected").forEach((el)=>el.classList.remove("selected"));
            this.domElement.classList.add("selected");
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
            this.domElement.classList.remove("selected");
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
            if(this.domElement.classList.contains("selected")){
                document.dispatchEvent(new CustomEvent('select', {detail:{element:this.domElement}}));
            }
            document.querySelectorAll('.dragover').forEach((el)=>el.classList.remove('dragover'));
        }
    }

    window.addEventListener('DOMContentLoaded', init);
})();