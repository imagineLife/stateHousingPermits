function resize(){
    
    let { parentDivWidth, parentDivHeight, divWidthLessMargins, divHeightLessMargins } = lib.getDimsFromParent(chartDiv, margin);
    
    let resizeW = (parentDivWidth > 900) ? 900 : parentDivWidth
    let percent = (resizeW > 550) ? .2 : .4
    svgObj.attr("height", resizeW * .6);
    gObj.attr('transform', `scale(${resizeW/1000}) translate(${resizeW * percent },0)`);
    d3.selectAll('.statePath').attr('d', d => pathGenerator(d))

}

function getValFromColumn(col, rowData){
    if(col == 'town'){
        return rowData.properties.NAME10
    }else{
        return rowData.properties.permits
    }
}

function buildChart(towns){

    colorScale.domain(d3.extent(towns.features, d => d.properties.permits))
    projection.fitExtent([[20, 20], [700, 580]], towns);
    
    //data-join for countries
    const townPaths = gObj.selectAll('path')
        .data(towns.features);

    //append a path for each country
    townPaths.enter().append('path')
    //set d based on country
    .attrs({
        'd': d => pathGenerator(d),
        'class': 'statePath',
        'fill': d => colorScale(+d.properties.permits)
    })
    .on('mousemove', d => showToolTip(d))
    .on("mouseout", tooltipDiv.style("display", "none"))

    svgObj.call(d3.zoom().on('zoom', function(){
        gObj.attr("transform", d3.event.transform);
    }));

    // svgObj.on('click', (d) => {
    //     console.log('test')
    //     console.log(d)
    //     tooltipDiv.style("display", "none")
    // })
}

function buildTable(data, colNames){
    let sortedData = data.features.sort((a, b) => b.properties.permits - a.properties.permits).slice(0,9)
    var table = d3.select('.top10Towns')
        thead = table.append("thead"),
        tbody = table.append("tbody");

    // append the header row
    thead.append("tr")
        .selectAll("th")
        .data(colNames)
        .enter()
        .append("th")
            .text(function(column) { return column; });

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(sortedData)
        .enter()
        .append("tr");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return colNames.map(function(column) {
                return {column: column, value: getValFromColumn(column, row)};
            });
        })
        .enter()
        .append("td")
        .html(d => d.value);
    
    return table;
}

function showToolTip(d){
    console.log('showToolTip')
    let name = d.properties.NAME10;
    let permits = d.properties.permits;

    clearTimeout()
    let thisTimeout = setTimeout(() => {
        tooltipDiv.style("display", "none")
    }, 2500)
    
    return tooltipDiv
        .style("left", (d3.event.pageX - 150 > 0 ) ? d3.event.pageX - 75 +  "px" : 0 + 'px')
        .style("top", d3.event.pageY - 100 + "px")
        .style("display", "inline-block")
        .html(`<b>${name}</b> - ${permits} permits`);
}

let tooltipDiv = d3.select('.toolTip')

let removeWater = (d) => d.properties["NAME10"].indexOf('defined') < 0;
let showTownName = d => `${d.properties["NAME10"]}: ${d.properties.permits}`;
const margin = { 
    left: 20, 
    right: 20,
    top: 20,
    bottom: 20
};
let {chartDiv, svgObj, gObj} = lib.makeD3ObjsFromParentID('chartDiv');
let { parentDivWidth, parentDivHeight, divWidthLessMargins, divHeightLessMargins } = lib.getDimsFromParent(chartDiv, margin);
var projection = d3.geoAlbersUsa();
const pathGenerator = d3.geoPath().projection(projection);
let colorScale = d3.scaleSequential(d3.interpolateReds);

//set svg height & width from div computed dimensions
//NOTE: can be the divLessMargins, for 'padding' effect
let resizeW = (parentDivWidth > 900) ? 900 : parentDivWidth
svgObj.attrs({
    "width" : resizeW,
    "height" : resizeW * .6
});

let percent = (resizeW > 550) ? .2 : .4
gObj.attr('transform', `scale(${resizeW/1000}) translate(${resizeW * percent},0)`);

loadAndProcessData().then(res => {
    buildChart(res)
    buildTable(res, ["town", "permits"])
});

//Add Resise listener & fn call
window.addEventListener("resize", resize);