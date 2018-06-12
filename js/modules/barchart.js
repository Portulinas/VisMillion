import { Module } from './module.js'

export class Barchart extends Module{
    constructor(options){
        super(options)
        this.type = 'barchart'

        var endTime = new Date()
        var startTime = new Date(endTime.getTime() - this.own_width / this.chart.pixelsPerSecond * 1000)

        this.domain = this.chart.y.domain()
        this.numBars = options.numBars || 10
        this.indexBars = 0
        this.barsColor = options.barsColor || 'blue'
        this.maxWidth = options.maxWidth || 0.9
        this.startingDomain = options.startingDomain || [0,100]

        this.y = this.chart.y.copy().range([0, this.numBars])
        this.x = d3.scaleLinear().domain(this.startingDomain).range([0, this.own_width])

        this.yScatter = this.chart.y.copy() // d3.scaleLinear().domain(this.chart.y.domain()).range([this.chart.height, 0])
        this.xScatter = d3.scaleTime().range([0, this.own_width])
        this.xScatter.domain([startTime, endTime])

        this.barsData = []
        for(let x = 0; x < this.numBars; x++){ this.barsData.push(0)}

        this.bandwidth = this.chart.height / this.numBars

        this.chart.x = d3.scaleLinear().range([0, this.chart.width - this.own_width])

        this.appendModuleOptions()

        this.transitions = []
    }


    appendModuleOptions(){
        var options = {
            title: this.type,
            index: this.index,
            maxWidth: parseInt(this.maxWidth * 100)
        }
        var markup = `
            <div class="mod-option">
                <h3>${options.title}</h3>
                <fieldset id="High-Flow${options.index}">
                    <legend>Options </legend>
                    <p>
                        <span id="maxWidthVal${options.index}">Max Width: ${options.maxWidth} % </span>
                        <div id="maxWidth${options.index}"></div>
                    </p>
                    <p>
                        <span>Bars Color: </span>
                        <input type="text" id="barsColor${options.index}" />
                    </p>
                </fieldset>


            </div>
        `

        $('.modules-options').append(markup)

        var module = this
        $('#barsColor'+options.index).spectrum({
            color: module.barsColor,
            showAlpha: true,
            preferredFormat: "rgba",
            showButtons: false,
            move: function(color){
                module.barsColor = color.toRgbString()
            }
        })

        $('#maxWidth'+options.index).slider({
            min:0.1,
            max:1,
            step:0.05,
            value: module.maxWidth,
            slide: function(event, ui){
                $(this).parent().find('#maxWidthVal'+module.index).text("Max Width: "+ parseInt(ui.value * 100) +"% ")
                module.maxWidth = ui.value
            }
        })
    }


    update(ts){
        this.own_width = this.chart.width / this.chart.modules.length
        this.x1 =  this.own_width * this.index
        var endTime = new Date(ts - ((this.own_width / this.chart.pixelsPerSecond * 1000) * ((this.chart.modules.length - 1) - this.index) ))
        var startTime = new Date(endTime.getTime() - this.own_width / this.chart.pixelsPerSecond * 1000)

        this.data = this.chart.filterData(null, endTime)

        var max = Math.max.apply(Math, this.domain)
        var slices = max/this.numBars
        var parent = this

        // TODO: OPTIMIZAR!!
        for(let i = 0; i < this.barsData.length; i++){
            this.barsData[i] = this.data.filter( el => Math.round(this.y(el.data)) == i ).length
        }

        // UPDATE DOMAINS
        if( Math.max( ...this.barsData ) > this.x.domain()[1] * this.maxWidth ){
            this.x.domain([0, this.x.domain()[1] + (this.x.domain()[1] * (1 - this.maxWidth))])
        }

        this.x.range([0, this.own_width])
        this.xScatter = d3.scaleTime().range([0, this.own_width])
        this.xScatter.domain([startTime, endTime])
        this.y.domain(this.chart.y.domain())
    }


    draw(){
        var context = this.chart.context
        var parent = this
        var max = Math.max.apply(Math, this.domain)
        var slices = max/this.numBars

        if(this.chart.modules.length > this.index + 1 == false || this.chart.modules[this.index+1].type == 'scatterchart'){
            this.data.forEach(function(el){
                if(! (parent.xScatter(el.ts) > parent.x(parent.barsData[(Math.ceil(el.data/slices) - 1)]))){
                    return
                }
                let cx = parent.chart.margin.left + parent.x1 + parent.xScatter(el.ts)
                let cy = parent.chart.margin.top + parent.yScatter(el.data)
                let r = 5
                let color = (parent.index == 0) ? 'blue' : 'orange'

                context.beginPath()
                context.fillStyle = color
                context.arc(cx, cy, r, 0, 2 * Math.PI, false)
                context.fill()
                context.closePath()
            })
        }

        for(var i=0; i < this.barsData.length; i++){
            let x,y,width,height,color;
            if(this.chart.modules.length > this.index + 1 == false || this.chart.modules[this.index+1].type == 'scatterchart'){
                x = this.chart.margin.left + this.x1
                y = this.chart.margin.top + (this.chart.height - this.bandwidth) - (i * this.bandwidth)
                width = this.x(this.barsData[i])
                height = this.bandwidth
            }else{
                x = this.chart.margin.left + this.x1 + (this.own_width - this.x(this.barsData[i]))
                y = this.chart.margin.top + (this.chart.height - this.bandwidth) - (i * this.bandwidth)
                width = this.x(this.barsData[i])
                height = this.bandwidth
            }
            color = this.barsColor
            context.beginPath()
            context.fillStyle = color
            context.rect(x,y,width,height)
            context.fill()
            context.strokeStyle = "1px"
            context.stroke()
            context.closePath()
        }
    }
}