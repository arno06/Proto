(function(){

    const inputs = {
        'img':{
            'label':'Image',
            'nodeName':'input',
            'attributes':{
                'type':'file',
                'accept':'.jpg, .jpeg, .gif, .svg, .webp, .png',
                'onchange':(e)=>{
                    let file = e.currentTarget.files[0];
                    if(!file.type.startsWith('image/')){
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event)=>{
                        selectedElement.style.backgroundImage = "url('"+event.target.result+"')";
                    };
                    reader.readAsDataURL(file);
                }
            }
        },
        'width':{
            'label':'Largeur',
            'nodeName':'input',
            'attributes':{
                'type':'text',
                'onkeyup':(e)=>{
                    selectedElement.style.width = e.currentTarget.value+'px';
                }
            },
            'valAttr':'value',
            'getValue':(pEl, pSelected)=>{pEl.value = pSelected.offsetWidth;}
        },
        'height':{
            'label':'Hauteur',
            'nodeName':'input',
            'attributes':{
                'type':'text',
                'onkeyup':(e)=>{
                    selectedElement.style.height = e.currentTarget.value+'px';
                }
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
            'nodeName':'div',
            'attributes':{
                'innerHTML':'Supprimer',
                'className':'button',
                'onclick':()=>{
                    selectedElement.remove();
                    unselect();
                    return false;
                }
            },
        },
        'foreground':{
            'nodeName':'div',
            'attributes':{
                'innerHTML':'Mettre au premier plan',
                'className':'button',
                'onclick':()=>{
                    let parent = selectedElement.parentNode;
                    selectedElement.remove();
                    parent.insertAdjacentElement('beforeend', selectedElement);
                    return false;
                }
            },
        },
        'background':{
            'nodeName':'div',
            'attributes':{
                'innerHTML':'Mettre en arrière plan',
                'className':'button',
                'onclick':()=>{
                    let parent = selectedElement.parentNode;
                    selectedElement.remove();
                    parent.insertAdjacentElement('afterbegin', selectedElement);
                    return false;
                }
            },
        }
    };

    let default_style = ['width', 'height'];
    let default_actions = ['foreground', 'background', 'delete'];

    const props = {
        'block':[].concat(default_style, default_actions),
        'text':['width', 'height', 'content', 'font', 'fontsize','foreground', 'background', 'delete'],
        'img':['img'].concat(default_style, default_actions),
        'input':['width', 'height', 'content', 'foreground', 'background', 'delete'],
        'button':['width', 'height', 'content', 'foreground', 'background', 'delete']
    };

    let clone = null;
    let selectedElement = null;

    function init(){
        new InventoryHandler();
        document.addEventListener(EditableElementEvent.SELECT, blockSelectedHandler);
        document.addEventListener(EditableElementEvent.UNSELECT, unselect);
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

    function update(pElement){

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

            this.elements = {};

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
            console.log(this.clone.selectorText);
            this.elements[this.clone.selectorText] = new EditableElement(this);
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

        unSelect(){
            for(let i in this.elements){
                if(!this.elements.hasOwnProperty(i)){
                    continue;
                }
                this.elements[i].unSelect();
            }
        }
    }

    class EditableElement{
        constructor(pInventory){
            this.magnet_treshold = 5;
            this.guides = [];
            this.inventory = pInventory;
            this.domElement = pInventory.clone;
            this.domElement.dataset.type = this.domElement.className;
            this.domElement.classList.add('element');
            this._mouseMovehandler = this.mouseMoveHandler.bind(this);
            this._mouseUpHandler = this.mouseUpHandler.bind(this);
            this._resizeHandler = this.resizeHandler.bind(this);
            this._resizedHandler = this.resizedHandler.bind(this);
            this._unselectHandler = (e)=>{
                if(e.target === this.domElement){
                    return;
                }
                this.unSelect();
            };
            this.domElement.addEventListener('mousedown', this.mouseDownHandler.bind(this));
        }

        mouseDownHandler(e){
            console.log("element down");
            this.ref = {x:e.layerX, y:e.layerY};
            let rect = this.domElement.getBoundingClientRect();
            let withinMoveZone = (this.ref.x < (rect.width - 10))&&(this.ref.y < (rect.height - 10));
            e.stopImmediatePropagation();
            e.stopPropagation();
            if(!withinMoveZone){
                this.domElement.classList.remove("selected");
                return;
            }
            this.inventory.unSelect();
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
            pStyle.element = d;
            this.guides.push(pStyle);
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
            val.x = Math.min(val.x, parentRect.width - rect.width);
            this.guides.forEach((g)=>{
                if(g.left){
                    val.x = this.deductConstraint(g.left, val.x, this.domElement.offsetWidth, g);
                }
                if(g.top){
                    val.y = this.deductConstraint(g.top, val.y, this.domElement.offsetHeight, g);
                }
            });
            this.domElement.style.left = Math.round(val.x)+"px";
            this.domElement.style.top = Math.round(val.y)+"px";
        }

        deductConstraint(pProp, pVal, pSizeVal, pGuide){
            if((pVal < (pProp+this.magnet_treshold)) && (pVal > (pProp-this.magnet_treshold))){
                pGuide.element.style.background = "red";
                return pProp;
            }
            if((pVal + pSizeVal) < (pProp + this.magnet_treshold) && (pVal + pSizeVal)>(pProp-this.magnet_treshold)){
                pGuide.element.style.background = "red";
                return pProp - pSizeVal;
            }
            pGuide.element.style.background = "transparent";
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
                this.createPoints();
                document.dispatchEvent(new CustomEvent(EditableElementEvent.SELECT, {detail:{element:this.domElement}}));
                this.domElement.parentNode.addEventListener('mouseup', this._unselectHandler, true);
            }else{
                this.unSelect();
            }
            document.querySelectorAll('.dragover').forEach((el)=>el.classList.remove('dragover'));
        }

        unSelect(){
            console.log("unselect");
            this.domElement.parentNode.removeEventListener('mouseup', this._unselectHandler, true);
            this.domElement.classList.remove("selected");
            this.domElement.querySelectorAll('.point')?.forEach((pEl)=>pEl.remove());
            document.dispatchEvent(new CustomEvent(EditableElementEvent.UNSELECT, {detail:{element:this.domElement}}));
        }

        createPoints(){
            const createEl = (pClasses)=>{
                let d = document.createElement('div');
                d.classList.add(...pClasses);
                this.domElement.appendChild(d);
                return d;
            }
            createEl(['point', 'top', 'left']);
            createEl(['point', 'top']);
            createEl(['point', 'top', 'right']);
            createEl(['point', 'left']);
            createEl(['point', 'right']);
            createEl(['point', 'bottom', 'left']);
            createEl(['point', 'bottom']);
            createEl(['point', 'bottom', 'right']);
            this.domElement.querySelectorAll('.point').forEach((pPoint)=>{
                pPoint.addEventListener('mousedown', (e)=>{
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    this.ref = this.domElement.getBoundingClientRect();
                    this.startingPoint = e.currentTarget;
                    this.domElement.parentNode.removeEventListener('mouseup', this._unselectHandler, true);
                    document.addEventListener('mousemove', this._resizeHandler, true);
                    console.log("point down");
                    document.addEventListener('mouseup', this._resizedHandler);
                });
            });
        }

        resizedHandler(e){
            this.startingPoint = null;
            document.removeEventListener('mouseup', this._resizedHandler);
            document.removeEventListener('mousemove', this._resizeHandler, true);
            this.domElement.parentNode.addEventListener('mouseup', this._unselectHandler, true);
        }

        resizeHandler(e){

            let parentRect = this.domElement.parentNode.getBoundingClientRect();

            let rect = this.domElement.getBoundingClientRect();
            let diff = {
                x: Math.round(e.pageX - rect.x),
                y: Math.round(e.pageY - rect.y)
            };

            if(this.startingPoint.classList.contains('bottom')){
                this.domElement.style.height = diff.y+'px';
            }
            if(this.startingPoint.classList.contains('right')){
                this.domElement.style.width = diff.x+'px';
            }
            if(this.startingPoint.classList.contains('top')){
                let nY = e.pageY - parentRect.y;
                this.domElement.style.top = (nY)+'px';
                this.domElement.style.height = (((this.ref.y + this.ref.height) - nY)-parentRect.y)+'px';
            }
            if(this.startingPoint.classList.contains('left')){
                let nX = e.pageX - parentRect.x;
                this.domElement.style.left = (nX)+'px';
                this.domElement.style.width = (((this.ref.x + this.ref.width) - nX) - parentRect.x)+'px';
            }
        }
    }

    const EditableElementEvent = {
        SELECT:'item_selected',
        UNSELECT:'item_unselected'
    };

    window.addEventListener('DOMContentLoaded', init);
})();