"use strict"; //ES6

class EntityLibraryPanelView extends NodeView
{
  constructor( entityLibraryJsonData ) {
		super();

    this.items = []

    this.libraryJson = entityLibraryJsonData

    this.lastSelectedItem = null

    this.setRect(100, 300, "rgba(0, 0, 0, 0.5)")

    this.contentView = new TableView(100, 300, true)
    this.addChild(this.contentView)

    this.populateLibrary()

    this.SetListener("libraryItemClicked", this.onLibraryItemClicked)
  }

  // return the itemId of the currently selected library item, otherwise return null
  getSelectedItemId() {
    if (this.lastSelectedItem != null && this.lastSelectedItem.isHighlighted()) {
      return this.lastSelectedItem.itemId
    }

    return null
  }

  populateLibrary() {
    for ( const elementId in this.libraryJson ) {
      const elementJson = this.libraryJson[elementId]
      var icon = new EntityLibraryIconView( elementId, elementJson )
      this.items.push(icon)
      //xxx todo: position

      //this.addChild(icon)
      this.contentView.addCell(icon)
    }
  }

  onLibraryItemClicked(e) {
    this.lastSelectedItem = e.itemNode

    // unhighlight any other icon
    for (const item of this.items) {
      if (item.itemId != e.itemId) {
        item.setHighlighted(false)
      }
    }
  }
}

class EntityLibraryIconView extends NodeView
{
  constructor( elementId, entityJsonData ) {
    super();

    this.itemId = elementId
    this.entityJson = entityJsonData

    this.iconSize = 25

    this.setCircle( this.iconSize /2, "#445500")

    this.setLabelWithOutline(this.entityJson.label, "12px Arial", "#FFFFFF", "#000000", 1)

    this.highlight = null

    this.setClick((e)=>{
      if (this.isHighlighted()) {
        this.setHighlighted(false)
      } else {
        this.setHighlighted(true)
        EventBus.ui.dispatch({ evtName: "libraryItemClicked", itemId: elementId, itemJson: this.entityJson, itemNode: this })
      }


    })
  }

  isHighlighted() {
    return (this.highlight != null)
  }

  setHighlighted(on) {
    if (on) {
      if (this.highlight == null) {
        this.highlight = new NodeView()
        this.highlight.setRectOutline(this.iconSize, this.iconSize, "#00AAAA", 2)
        this.addChild(this.highlight)
      }

    } else {
      if (this.highlight != null) {
        this.removeChild(this.highlight)
        this.highlight = null
      }
    }
  }
}