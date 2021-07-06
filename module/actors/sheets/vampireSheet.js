
/**
 * Extend the basic ActorSheet
 * @extends {ActorSheet}
 */
export class VampireSheet extends ActorSheet {

    constructor(...args) {
        super(...args);
    }

    /** @inheritdoc */
	static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
        width: 1024,
        height: 700,
        classes: ["dav20", "sheet", "actor"],
        resizable: true,
        scrollY: [".tab.details"],
        tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}]
      });
    }

    /** @override */
    get template() {
        return 'systems/dav20/templates/actors/actor-sheet.html'
    }

    /** @override */
    getData() {
        const data = super.getData();
        const actorData = data.data;
        data.config = CONFIG.DAV20;

        data.actor = actorData;
        data.data = actorData.data;

        // Owned Items
        data.items = actorData.items;
        for ( let i of data.items ) {
        const item = this.actor.items.get(i._id);
        i.labels = item.labels;
        }

        return data;
    }

    
  activateListeners (html) {
    console.log("dav20 | activating listeners...");

    this._setupDotCounters(html)
    super.activateListeners(html)
    html.find('.resource-value > .resource-value-step').click(this._onDotCounterChange.bind(this))
    html.find('.resource-value > .resource-value-empty').click(this._onDotCounterEmpty.bind(this))

    if (!this.options.editable) {
        console.log("dav20 | sheet is not editable");
        return
    }

    console.log("dav20 | listener activated");
  }

  _onDotCounterEmpty (event) {
    console.log("dav20 | _onDotCounterEmpty");
    event.preventDefault()
    if (this.locked) return
    const element = event.currentTarget
    const parent = $(element.parentNode)
    const fieldStrings = parent[0].dataset.name
    const fields = fieldStrings.split('.')
    const steps = parent.find('.resource-value-empty')

    steps.removeClass('active')
    this._assignToActorField(fields, 0)
  }

  _onDotCounterChange (event) {
    console.log("dav20 | _onDotCounterChange");

    event.preventDefault()
    if (this.locked) return
    const element = event.currentTarget
    const dataset = element.dataset
    const index = Number(dataset.index)
    const parent = $(element.parentNode)
    const fieldStrings = parent[0].dataset.name
    const fields = fieldStrings.split('.')
    const steps = parent.find('.resource-value-step')
    if (index < 0 || index > steps.length) {
        console.log("dav20 |  Invalid index")
      return
    }

    steps.each(function (i) {
      if (i <= index) {
        console.log("dav20 | activate until index: " + index)

        $(this).addClass('active')
      }
    })


    this._assignToActorField(fields, index)
  }

  _setupDotCounters (html) {
    const actorData = this.actor.data.toObject(false);
    console.log("_setupDotCounters")

    if ( actorData.data.abilities ) {
        
        for ( let [a, abl] of Object.entries(actorData.data.abilities)) {

            if(abl.value < 0) {
                console.log("Negative value for: "+ a )   
                continue
            }

            console.log("Ability value: " +  abl.value + " for " + a ) 

            html.find('.resource-value').each(function () {
                const value = Number(this.dataset.value)
                $(this).find('.resource-value-step').each(function (i) {
                    if (i <= value) {
                        $(this).addClass('active')
                    }
                    
                    if (abl.value == 0) {
                        $(this).removeClass('active')
                    }
                })
            })
        }
    }
  }

   // There's gotta be a better way to do this but for the life of me I can't figure it out
   _assignToActorField (fields, value) {
    const actorData = duplicate(this.actor)
    // update actor owned items
    if (fields.length === 2 && fields[0] === 'items') {
      for (const i of actorData.items) {
        if (fields[1] === i._id) {
          i.data.points = value
          break
        }
      }
    } else {
      const lastField = fields.pop()
      fields.reduce((data, field) => data[field], actorData)[lastField] = value
    }
    this.actor.update(actorData)
  }

}