"use strict"; //ES6

var bShowDebug = false;

class Config {
	static get areSpritesCentered() {
		return true;
  }
  static get canSerializeNodeViews() {
    return true
  }
}

function game_create()
{
	var app = new Application("UIEditor", "content");
  window.app = app;
  
  window.jsonOutput = document.getElementById("jsonOutput")
  window.nodeTree = document.getElementById("nodeTree")
  window.divInspector = document.getElementById("divInspector")
  window.nodeLibrary = document.getElementById("nodeLibrary")
	
	var stateController = Service.Get("state");
	stateController.addState("loading", LoadingState);
	stateController.addState("editor", EditorState);
	
	var resources = [
			"gfx/btn_blue.sprite",
			"gfx/btn_dark.sprite",
			"gfx/btn_white.sprite",
			"gfx/aelius_floor.jpg",
			"gfx/explosion_1.sprite",
			"gfx/workbench3.png"
			];
	stateController.gotoState("loading", [resources, "editor"]);
	
	app.Play();
};

window.updateJsonOutput = function() {
  var editorState = Service.Get("state").currentState
  var json = editorState.view.rootView.toJson()
  window.jsonOutput.value = JSON.stringify(json)
}

window.updateTreeOutput = function() {
  var editorState = Service.Get("state").currentState
  var json = editorState.view.rootView.toJson()

  window.nodeTree.innerHTML = _rBuildTreeString(json, "_")
}
function _rBuildTreeString(json, idxString) {
  var className = json.classType

  var result = className
  
  if (json.children && json.children.length > 0) {
    result += "<ol>"
    var childIdx = 0
    for (var childJson of json.children) {
      var childIdxString = idxString + "," + childIdx
      result += '<li onclick="window.treeNodeClicked(\''+childIdxString+'\')">'
      result += _rBuildTreeString(childJson, childIdxString)
      result += "</li>"
      childIdx++
    }
    result += "</ol>"
  }

  return result
}
//idxString format  "_,0,3,2" == root.children[0].children[3].children[2]
window.treeNodeClicked = function(idxString) {
  var idxArr = idxString.split(",")
  idxArr.shift()

  var editorState = Service.Get("state").currentState
  var root = editorState.view.rootView
  var node = root

  while (idxArr.length > 0) {
    node = node.children[idxArr[0]]
    idxArr.shift()
  }
   
  console.log("select node " + JSON.stringify(node.toJson()) )
  window.setInspector(node)
}

window.clearInspector = function() {
  window.divInspector.innerHTML = ""
  window.currentInspectorNode = null
}

window.setInspector = function(viewNode) {
  window.divInspector.innerHTML = _buildInspectorHTML(viewNode)
  window.currentInspectorNode = viewNode
}
function _buildInspectorHTML(viewNode) {
  var json = viewNode.toJson(true)

  var result = '<form id="inspectorForm" onsubmit="return false;"><table>'

  for( var property in json) {
    result += _createTextRow(property, JSON.stringify(json[property]))
  }
  result += '</table><br>'
  result += '<input type="submit" onclick="window.doInspectorChange();" value="Update Node"></input>'
  result += '<input type="submit" onclick="window.doSiblingShift();" value="Swap Siblings"></input>'
  result += '<input type="submit" onclick="window.doParentShift(true);" value="<-"></input>'
  result += '<input type="submit" onclick="window.doParentShift(false);" value="->"></input>'
  result += '</form>'
  return result
}
function _createTextRow(id, value) {
  if (value.length > 20) {
    var rows = 1 + (value.length / 20)
    return '<tr><td>'+id+'</td><td><textArea name="nodeProp" spellcheck="false" id="'+id+'" cols=25 rows='+rows+'>'+value+'</textArea></td></tr>'
  } else {
    return '<tr><td>'+id+'</td><td><input name="nodeProp" type="text" id="'+id+'" value=\''+value+'\'></input></td></tr>'
  }
}
window.doInspectorChange = function() {
  console.log("update node from inspector changes")
  var nodeView = window.currentInspectorNode

  var nodeJson = nodeView.toJson(false) //dont ignore children this time

  var elements = document.getElementsByName("nodeProp")
  for (var textInput of elements) {
    var value = textInput.value
    var valJson = JSON.parse(value)
    var propName = textInput.id

    nodeJson[propName] = valJson
  }

  // reload in-place (dont create new object)
  nodeView.loadJson(nodeJson)
  
  window.updateJsonOutput()
}
function _setVectorFromInput(vec, inputValue) {
  var posSplit = inputValue.split(",")
  var x = parseFloat(posSplit[0])
  var y = parseFloat(posSplit[1])
  vec.setVal(x, y)
}
function _setRectFromInput(rect, inputValue) {
  var posSplit = inputValue.split(",")
  var x = parseFloat(posSplit[0])
  var y = parseFloat(posSplit[1])
  var w = parseFloat(posSplit[2])
  var h = parseFloat(posSplit[3])
  rect.setVal(x, y, w, h)
}
window.doSiblingShift = function() {
  var nodeView = window.currentInspectorNode
  var parent = nodeView.getParent()
  nodeView.removeFromParent()
  parent.addChild(nodeView)

  window.updateTreeOutput()
  window.updateJsonOutput()
}
window.doParentShift = function(directionUp) {
  var nodeView = window.currentInspectorNode
  
  var parent = nodeView.getParent()
  if (parent == null) {
    console.log("Cant shift without a parent")
    return;
  }
  if (directionUp) {
    // move this node to it's parent
     
     var parentParent = parent.getParent()
     if (parentParent != null) {
       nodeView.removeFromParent()
       parentParent.addChild(nodeView)
     }
  } else {
    //swap this node with its first child
    var firstChild = nodeView.getChildByIdx(0)
  }

  window.updateTreeOutput()
  window.updateJsonOutput()
}
window.editorCreateNode = function() {
  var option = window.nodeLibrary.options[window.nodeLibrary.selectedIndex].text

  var parent = null
  if (window.currentInspectorNode != null) {
    parent = window.currentInspectorNode
  } else {
    var editorState = Service.Get("state").currentState
    parent = editorState.view.rootView
  }

  var newNode = null
  switch(option) {
    case "Circle":
      newNode = _createCircle()
    break;
    case "Rectangle":
      newNode = _createRect()
    break;
    case "Button":
      newNode = _createButton()
    break;
    case "Sprite":
      newNode = _createSprite()
    break;
    case "Image":
      newNode = _createImage()
    break;
    default:
      newNode = new NodeView()
    break;
  }

  parent.addChild(newNode)

  window.setInspector(newNode)
  window.updateJsonOutput()
  window.updateTreeOutput()
}
//TODO: instead of using multiple 'prompt()' calls, should create a dynamic form based on library selection
function _createCircle() {
  var strRadius = prompt("Radius", "25")
  var radius = parseFloat(strRadius)
  var strColor = prompt("Color rgba(255,255,255,0.5)", "255,255,255,1.0")
  var color = "rgba(" + strColor + ")"
  var node = new NodeView()
  node.setCircle( radius, color)
  return node
}
function _createRect() {
  var strDimentions = prompt("Rect w,h", "50,50")
  var dim = strDimentions.split(",")
  var strColor = prompt("Color rgba(255,255,255,0.5)", "255,255,255,1.0")
  var color = "rgba(" + strColor + ")"
  var node = new NodeView()
  node.setRect( parseFloat(dim[0]), parseFloat(dim[1]), color)
  return node
}
function _createButton() {
  var btnId = prompt("Button ID", "btnEventID")
  var sprite = prompt("Button sprite", "gfx/btn_blue.png")
  var label = prompt("Button label", "button label")
  var node = new ButtonView(btnId, sprite, label)
  return node
}
function _createImage() {
  var strPath = prompt("Sprite path", "gfx/mySprite.sprite")
  var node = new NodeView()
  node.setSprite(strPath, 0, false)
  return node
}
function _createImage() {
  var strPath = prompt("Image path", "gfx/myImage.png")
  var node = new NodeView()
  node.setImage(strPath)
  return node
}

window.editorReset = function() {
  console.log("doReset")
  var editorState = Service.Get("state").currentState
  editorState.view.clearUI()

  window.clearInspector()
}

window.editorLoad = function() {
  console.log("doLoad")

  var editorState = Service.Get("state").currentState
  var json = JSON.parse(window.jsonOutput.value)
  editorState.view.loadFromJson(json)

  window.clearInspector()
}

window.editorCopyToClipboard = function() {
  console.log("do copy to clipboard")

  //1) highlight the text in the text area
  window.jsonOutput.select()
  //2) run 'copy' command
  var successful = document.execCommand('copy');
  console.log('Copying text command ' + successful ? 'success' : 'failed')
}