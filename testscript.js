class Script {
  constructor(parent=null,options={}) {
    this.wrapper=document.createElement("div");
    this.wrapper.classList.add('blocks');
    this.wrapper.classList.add('blocks-blockwrapper');
    if (parent) parent.appendChild(this.wrapper);
    this.children=[];
    this.x=options.x||0;
    this.y=options.y||0;
    this.isattr=!!options.attrscript;
    this.friendless=!!options.lonely;
    this.children=[];
    if (!options.dragger&&!options.dontregister) Script.scripts.push(this);
  }
  get x() {return this._x;}
  set x(x) {
    this._x=x;
    this.wrapper.style.transform=`translate(${this._x}px,${this._y}px)`;
  }
  get y() {return this._y;}
  set y(y) {
    this._y=y;
    this.wrapper.style.transform=`translate(${this._x}px,${this._y}px)`;
  }
  set parent(parent) {
    parent.appendChild(this.wrapper);
  }
  updateback() { // because blocks treat scripts like c blocks
    this.updateblockpos();
  }
  updateblockpos() {
    var innerheight=0,j=0;
    if (this.isattr) for (var i of this.children) i.x=innerheight,innerheight+=i.visualwidth,i.parent[1]=j,j++;
    else for (var i of this.children) i.y=innerheight,innerheight+=i.visualheight,i.parent[1]=j,j++;
  }
  addchild(block,index=-1) {
    if (block.type!=='attr'&&!this.isattr) {
      if (block.parent) block.parent[0].removechild(block);
      block.x=0;
      if (~index&&index<this.children.length) {
        this.children.splice(index,0,block);
        block.insertTo(this.wrapper,this.wrapper.children[index]);
        block.parent=[this,index];
      } else {
        this.children.push(block);
        block.appendTo(this.wrapper);
        block.parent=[this,this.children.length-1];
      }
      this.updateblockpos();
    } else if (block.type==='attr'&&this.isattr) {
      if (block.parent) block.parent[0] instanceof Script?block.parent[0].removechild(block):block.parent[0].removeattr(block);
      block.x=0;
      if (~index) {
        this.children.splice(index,0,block);
        block.insertTo(this.wrapper,this.wrapper.children[index]);
        block.parent=[this,index];
      } else {
        this.children.push(block);
        block.appendTo(this.wrapper);
        block.parent=[this,this.children.length-1];
      }
      this.updateblockpos();
    }
  }
  removechild(block) {
    this.wrapper.removeChild(this.children[block.parent[1]].wrapper);
    this.children.splice(block.parent[1],1);
    for (var i=block.parent[1];i<this.children.length;i++) this.children[i].parent[1]=i;
    this.updateblockpos();
    block.parent='';
    if (!this.children.length) {
      this.wrapper.parentNode.removeChild(this.wrapper);
      for (var span in this) this[span]=null;
      this.dead=true;
      for (var i=0;i<Script.scripts.length;i++) if (Script.scripts[i]===this) {
        Script.scripts.splice(i,1);
        break;
      }
    }
  }
  get hitboxes() {
    if (!this.isattr&&!this.friendless) {
      var hitboxes=[],
      insertblocks=(blocks,to,index=-1)=>{
        var t=[to.wrapper.parentNode,to.x,to.y];
        if (blocks[0].type==='c'&&blocks[0].children.length===0&&~index)
          for (var i=index;to.children&&i<to.children.length;) blocks[0].addchild(to.children[i]);
        if (to.children) {
          if (index===0&&to instanceof Script) t=to.visualheight;
          else if (!~index) index=to.children.length;
          for (var i=blocks.length-1;i>=0;i--) {
            blocks[i].moving=false;
            to.addchild(blocks[i],index);
          }
          if (index===0&&to instanceof Script) to.y-=to.visualheight-t;
        } else {
          t=new Script(t[0],{x:t[1],y:t[2]});
          for (var i=0;i<blocks.length;i++) {
            blocks[i].moving=false;
            t.addchild(blocks[i]);
          }
          if (index===0&&to instanceof Script) t.x-=15,t.y-=30;
        }
      },
      box=this.wrapper.getBoundingClientRect();
      for (var i of this.children) hitboxes.push(...i.hitboxes);
      hitboxes.push(new Hitbox(box.left-15,box.top,box.left+this.children[0].visualwidth,box.top-30,[box.left,box.top,false,this.visualheight],blocks=>{
        insertblocks(blocks,this,0);
      }));
      hitboxes.push(new Hitbox(box.left-15,box.top+this.visualheight,box.left+this.children[this.children.length-1].visualwidth,box.top+this.visualheight+30,[box.left,box.top+this.visualheight,true],blocks=>{
        insertblocks(blocks,this);
      }));
      return hitboxes;
    } else return [];
  }
  get attrhitboxes() {
    if (!this.friendless) {
      var hitboxes=[];
      for (var i of this.children) hitboxes.push(...i.attrhitboxes);
      return hitboxes;
    } else return [];
  }
  get visualheight() {
    return this.children[this.children.length-1].y+this.children[this.children.length-1].visualheight;
  }
  get json() {
    var r=[];
    for (var i of this.children) r.push(i.json);
    return [this.x,this.y,r];
  }
  static get JSON() {
    var r=[];
    for (var i of Script.scripts) r.push(i.json);
    return r;
  }
  kill() {
    if (this.children.length) {
      for (;this.children&&this.children.length;) this.removechild(this.children[0]);
    } else {
      this.wrapper.parentNode.removeChild(this.wrapper);
      for (var span in this) this[span]=null;
      this.dead=true;
      for (var i=0;i<Script.scripts.length;i++) if (Script.scripts[i]===this) {
        Script.scripts.splice(i,1);
        break;
      }
    }
  }
  get killable() {
    for (var i of this.children) if (!i.killable) return false;
    return true;
  }
  whoOwnsThisBack(backelem) { // "Who owns this back?" asks the Script class.
    var t; // "Not me," said the script.
    for (var i of this.children) { // "I'll ask my blocks."
      if (t=i.doYouOwnThisBack(backelem)) // And to each of its blocks it asked, "Do you own this back?"
        return t; // Finally, a block didn't respond "false." Overjoyed, the script immediately reported its findings to the Script class.
    }
    return false; // But when all of its blocks responded "false," the script sadly responded "false" to the Script class.
  }
  static backowner(backelem) { // "Give me the owner of this back element," the caller demanded.
    var t; // "Okay," the Script class said obediently.
    for (var i of Script.scripts) { // To each of the scripts the class asked:
      if (t=i.whoOwnsThisBack(backelem)) // "Who owns this back?"
        return t; // Finally, a script didn't respond false. The Script class dutifully returned its findings to the caller.
    }
    return null; // However, the Script class was not able to find a block that owned the back. "Maybe the script with the block wasn't registered, or it isn't a back of a block," the Script class responded with a null.
  }
}
class Drag extends Script {
  constructor(parent,attrdrag=false) {
    super(parent,{attrscript:attrdrag,dragger:true});
    this.wrapper.classList.add('blocks-dragger');
    if (!attrdrag) Script.dragger=this;
    this.preview=document.createElement("div");
    this.preview.classList.add('blocks');
    this.preview.classList.add('blocks-movepreview');
    this.preview.style.display='none';
    document.body.appendChild(this.preview);
    var mousemove=(e,istouch)=>{
      if (this.d) {
        if (!this.d.down) {
          this.d.down=true;
          this.d.hitboxes=[];
          if (attrdrag) {
            for (var i=Script.scripts.length-1;i>=0;i--) this.d.hitboxes.push(...Script.scripts[i].attrhitboxes);
          } else {
            this.preview.style.width=this.children[0].visualwidth+'px';
            for (var i=Script.scripts.length-1;i>=0;i--) this.d.hitboxes.push(...Script.scripts[i].hitboxes);
          }
          document.body.classList.add('blocks-grabbing');
        }
        this.x=(istouch?e.touches[0].clientX:e.clientX)-this.d.x;
        this.y=(istouch?e.touches[0].clientY:e.clientY)-this.d.y;
        if (attrdrag) {
          var t=true;
          for (var i of this.d.hitboxes) if (i.pointinhitbox(this.x,this.y)) {
            t=false;
            this.preview.style.display='block';
            this.preview.style.left=i.preview[0]+'px';
            this.preview.style.top=i.preview[1]+'px';
            break;
          }
          if (t) this.preview.style.display='none';
        } else {
          var t=true;
          for (var i of this.d.hitboxes) if (i.pointinhitbox(this.x,this.y)) {
            t=false;
            this.preview.style.display='block';
            this.preview.style.left=i.preview[0]+'px';
            this.preview.style.top=i.preview[1]+'px';
            if (this.children[0].type==='c'&&this.children[0].children.length===0) {
              if (i.preview[2]) {
                this.preview.classList.remove('blocks-cblockpreview');
                this.preview.style.height='1px';
                this.children[0].updateback();
              } else {
                this.preview.classList.add('blocks-cblockpreview');
                this.preview.style.height=i.preview[3]+'px';
                this.children[0].updateback(i.preview[3]);
              }
            }
            break;
          }
          if (t) {
            this.preview.style.display='none';
            if (this.children[0].type==='c'&&this.children[0].children.length===0) this.children[0].updateback();
          }
        }
      }
    },
    mouseup=(e,istouch)=>{
      if (this.d) {
        if (!this.d.down) {
          this.d.down=true;
          this.d.hitboxes=[];
          if (attrdrag) {
            for (var i=Script.scripts.length-1;i>=0;i--) this.d.hitboxes.push(...Script.scripts[i].attrhitboxes);
          } else {
            this.preview.style.width=this.children[0].visualwidth+'px';
            for (var i=Script.scripts.length-1;i>=0;i--) this.d.hitboxes.push(...Script.scripts[i].hitboxes);
          }
        }
        this.x=(istouch?e.changedTouches[0].clientX:e.clientX)-this.d.x;
        this.y=(istouch?e.changedTouches[0].clientY:e.clientY)-this.d.y;
        if (attrdrag) {
          var t=true;
          for (var i of this.d.hitboxes) if (i.pointinhitbox(this.x,this.y)) {
            t=false;
            i.hit(this.children);
            break;
          }
          if (t) {
            var newscript=new Script(this.wrapper.parentNode,{x:0,y:0,attrscript:true});
            newscript.x=this.x-newscript.wrapper.getBoundingClientRect().left;
            newscript.y=this.y-newscript.wrapper.getBoundingClientRect().top;
            if ((this.deleteX!==undefined&&newscript.x<this.deleteX||this.deleteY!==undefined&&newscript.y<this.deleteY)&&newscript.killable) {
              newscript.kill();
              while (this.children.length) this.removechild(this.children[0]);
            } else {
              if (newscript.x<0) {var derp=newscript.x;for (var i of Script.scripts) i.x-=derp;}
              if (newscript.y<0) {var derp=newscript.y;for (var i of Script.scripts) i.y-=derp;}
              while (this.children.length) {
                this.children[0].moving=false;
                newscript.addchild(this.children[0]);
              }
            }
          }
        } else {
          var t=true,shouldIworry=this.children[0].type==='c'&&this.children[0].children.length===0;
          for (var i of this.d.hitboxes) if (i.pointinhitbox(this.x,this.y)) {
            t=false;
            i.hit(this.children);
            break;
          }
          if (t) {
            var newscript=new Script(this.wrapper.parentNode,{x:0,y:0});
            newscript.x=this.x-newscript.wrapper.getBoundingClientRect().left;
            newscript.y=this.y-newscript.wrapper.getBoundingClientRect().top;
            if ((this.deleteX!==undefined&&newscript.x<this.deleteX||this.deleteY!==undefined&&newscript.y<this.deleteY)&&this.killable) {
              newscript.kill();
              while (this.children.length) this.removechild(this.children[0]);
            } else {
              if (newscript.x<0) {var derp=newscript.x;for (var i of Script.scripts) i.x-=derp;}
              if (newscript.y<0) {var derp=newscript.y;for (var i of Script.scripts) i.y-=derp;}
              while (this.children.length) {
                this.children[0].moving=false;
                newscript.addchild(this.children[0]);
              }
            }
          }
          for (var j of Script.scripts) {
            if (j.x<0) {var derp=j.x;for (var i of Script.scripts) i.x-=derp;}
            if (j.y<0) {var derp=j.y;for (var i of Script.scripts) i.y-=derp;}
          }
          this.preview.classList.remove('blocks-cblockpreview');
          this.preview.style.height='1px';
        }
        this.preview.style.display='none';
        document.body.classList.remove('blocks-grabbing');
        this.d=false;
      }
    };
    document.addEventListener("mousemove",e=>mousemove(e,false),false);
    document.addEventListener("mouseup",e=>mouseup(e,false),false);
    document.addEventListener("touchmove",e=>mousemove(e,true),{passive:false});
    document.addEventListener("touchend",e=>mouseup(e,true),{passive:false});
  }
  removechild(block) {
    this.wrapper.removeChild(this.wrapper.children[block.parent[1]]);
    this.children.splice(block.parent[1],1);
    for (var i=block.parent[1];i<this.children.length;i++) this.children[i].parent[1]=i;
    this.updateblockpos();
    block.parent='';
  }
}
class AttrDrag extends Drag {
  constructor(parent) {
    super(parent,true);
    Script.attrdragger=this;
    this.preview.style.height='30px';
  }
}
Script.scripts=[];
