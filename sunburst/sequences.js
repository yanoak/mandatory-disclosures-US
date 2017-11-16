

// Dimensions of sunburst.
var width = 400;
var height = 400;
var radius = (Math.min(width, height)-50 )/ 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 380, h: 20, s: 3, t: 10
};

// Mapping of step names to colors.
var colors = {
  "home": "#5687d1",
  "product": "#7b615c",
  "search": "#de783b",
  "account": "#6ab975",
  "other": "#a173d1",
  "end": "#bbbbbb"
};

var colores_g =  
    ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];


var colors_md = ['#edbd00','#367d85','#97ba4c','#f5662b','#3366cc','#329262']

var negativeColor = "rgba(1,1,1,0.2)";

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0; 
var nestedData = {};

// Format for displaying numbers
var numFormat = d3.format(",f");

var vis1 = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container1")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

//var vis2 = d3.select("#chart").append("svg:svg")
//    .attr("width", width)
//    .attr("height", height)
//    .append("svg:g")
//    .attr("id", "container2")
//    .attr("transform", "translate(" + (width * 0.5) + "," + height / 2 + ")");

var partition = d3.layout.partition()
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return d.size; });

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

// Use d3.text and d3.csv.parseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.
d3.text("sunburst_data.csv", function(text) {
  var csv = d3.csv.parseRows(text);
//  console.log(csv);
//  console.log(text);

  nestedData = d3.nest()
    .key(function(d) {return d[0]; })  // nest by state
//    .key(function(d) { return d[1]; })  // next by income or expenditure
    .map(csv);
  
  console.log(nestedData);
  
  delete nestedData["State"];
  
  for (state in nestedData) {
    nestedData[state].map(function(d) {
      return d.splice(0,1)
    });
  }
    
  
  console.log(nestedData);
      
  d3.select("#stateSelector")
  .selectAll("option")
  .data(Object.getOwnPropertyNames(nestedData))
  .enter().append("option")
  .attr("value", function (d) { return d; })
  .text(function (d) { return d; });
  
  var e = document.getElementById("stateSelector");
  var strState = e.options[e.selectedIndex].value;

//  buildState(strState);
  
  var jsonData = buildHierarchy(
    nestedData[strState]
  );
//  var jsonExpenditure = buildHierarchy(
//    nestedData[strState]["expenditure"]
//  );
  
  createVisualization(jsonData,vis1);
//  createVisualization(jsonExpenditure,vis2);
  
  d3.select('#stateSelector')
  .on('change', function() {
    return buildState(d3.select(this).property('value'));
  });
  
});

function buildState(strState) {
  var jsonState = buildHierarchy(
    nestedData[strState]
  );
//  var jsonExpenditure = buildHierarchy(
//    nestedData[year]["expenditure"]
//  );

  console.log(nestedData);
  console.log(jsonState);
  updateVisualization(jsonState,vis1);
//  updateVisualization(jsonExpenditure,vis2);
}



// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json,viz) {

  var firstVis = viz === vis1 ? true : false;
  
  // Basic setup of page elements.
  if (firstVis) initializeBreadcrumbTrail("trail1");
  else initializeBreadcrumbTrail("trail2"); 
//  drawLegend();
//  d3.select("#togglelegend").on("click", toggleLegend);

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  viz.append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0);

  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partition.nodes(json)
      .filter(function(d) {
//      console.log(d);
      return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
      });

  var path = viz.data([json]).selectAll("path")
      .data(nodes)
      .enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", function(d) { 
//        return colores_g[categories[d.name] % (colores_g.length)];
//        console.log(d);
        if (d.positive || d.positive === null)
          return colores_g[d.name.charCodeAt(0) % (colores_g.length)];
        else 
          return negativeColor;
      })
//      .style("fill", function(d) { return colors[d.name]; })
      .style("opacity", 1)
      .on("mouseover", function(d) { 
//        console.log("Calling mouseover from createVisualization");  
        if (firstVis)
          return mouseover(d,"#container1")
        else 
          return mouseover(d,"#container2");
      });

  // Add the mouseleave handler to the bounding circle.
//  if (viz === vis1)
    d3.select("#container1")
      .on("mouseleave", function(d) {
//        console.log("Calling mouseover from createVisualization");  
        return mouseleave(d,"#container1")
      });
//  else 
    d3.select("#container2")
      .on("mouseleave", function(d) {
//        console.log("Calling mouseover from createVisualization"); 
        return mouseleave(d,"#container2")
      });

  // Get total size of the tree = value of root node from partition.
  totalSize = path.node().__data__.value;
 };

function updateVisualization(json,viz) {

  console.log(json);
  
  var firstVis = viz === vis1 ? true : false;
  
  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partition.nodes(json)
      .filter(function(d) {
      return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
      });
  
  viz.data([json]).selectAll("path").remove();
  
  var path = viz.data([json]).selectAll("path")
      .data(nodes)
  
  path.enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", function(d) { 
//        return colores_g[categories[d.name] % (colores_g.length)];   
        console.log(d);
        if (d.positive || d.positive === null)
          return colores_g[d.name.charCodeAt(0) % (colores_g.length)];
        else 
          return negativeColor;

      })
//      .style("fill", function(d) { return colors[d.name]; })
      .style("opacity", 1)
      .on("mouseover", function(d) { 
//        console.log("Calling mouseover from createVisualization");  
        if (firstVis)
          return mouseover(d,"#container1")
        else 
          return mouseover(d,"#container2");
      });
  
//  path.exit().remove();

  // Add the mouseleave handler to the bounding circle.
//  if (viz === vis1)
    d3.select("#container1")
      .on("mouseleave", function(d) {
        console.log("Calling mouseover from createVisualization");  
        return mouseleave(d,"#container1")
      });
//  else 
    d3.select("#container2")
      .on("mouseleave", function(d) {
        console.log("Calling mouseover from createVisualization"); 
        return mouseleave(d,"#container2")
      });

  // Get total size of the tree = value of root node from partition.
  totalSize = path.node().__data__.value;
 };

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d,container) {

  var trail = (container == "#container1") ? "#trail1" : "#trail2";
  var percentageContainer = (container == "#container1") ? "#percentage1" : "#percentage2";
  var explanation = (container == "#container1") ? "#explanation1" : "#explanation2";
  
//  console.log("over " + container);
  var percentage = (100 * d.value / totalSize).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }

  d3.selectAll(percentageContainer)
      .text(percentageString);

  d3.select(explanation)
      .style("visibility", "");

  var sequenceArray = getAncestors(d);
  updateBreadcrumbs(sequenceArray, percentageString, d.value, trail, d.positive);

  // Fade all the segments.
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  d3.select(container)
    .selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d,container) {
  
//  console.log("leave " + container);
  
  var trail = (container == "#container1") ? "#trail1" : "#trail2";
  var explanation = (container == "#container1") ? "#explanation1" : "#explanation2";
//  console.log(trail);

  // Hide the breadcrumb trail
  d3.selectAll(trail)
      .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.select("#container1")
    .selectAll("path")
    .transition()
    .duration(500)
    .style("opacity", 1)
    .each("end", function() {
        d3.select(this).on("mouseover", function(d) { return mouseover(d,"#container1");});
      });
  
  d3.select("#container2")
    .selectAll("path")
    .transition()
    .duration(500)
    .style("opacity", 1)
    .each("end", function() {
        d3.select(this).on("mouseover", function(d) { return mouseover(d,"#container2");});
      });
  

  d3.select(explanation)
      .style("visibility", "hidden");
}

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
  var path = [];
  var current = node;
  while (current.parent) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
}

function initializeBreadcrumbTrail(trail) {
  
  var titlesText = trail == "trail1" ? "Expenditures" : "Incomes";
  
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", width)
      .attr("height", 200)
      .attr("id", trail);
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
//  console.log(points);
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString, value, trail, poz) {
  
  // Data join; key function combines name and depth (= position in sequence).
  var g = d3.selectAll(trail)
      .selectAll("g")
      .data(nodeArray, function(d) { 
//        console.log(d.name);
        return d.name + d.depth; 
      });

//  console.log(g);
  // Add breadcrumb and label for entering nodes.
  var entering = g.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
//      .style("fill", function(d) { return colors[d.name]; });
      .style("fill", function(d) { 
//        return colores_g[categories[d.name] % (colores_g.length)];
        return colores_g[d.name.charCodeAt(0) % (colores_g.length)];
//        return colors[d.name]; 
      });

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { 
        return d.name; 
      });

  // Set position for entering and updating nodes.
  g.attr("transform", function(d, i) {
//    return "translate(" + i * (b.w + b.s) + ", 0)";
    return "translate(0, " + i * (b.h + b.s) + ")";
  });

  // Remove exiting nodes.
  g.exit().remove();

  // Now move and update the percentage at the end.
  d3.selectAll(trail).select("#endlabel")
      .attr("x", 0.5 * (b.w + b.s))
      .attr("y", (nodeArray.length + 0.5) * (b.h + b.s))
//      .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
//      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function (d) {
        if (poz)
          return "US$ " + numFormat(value) + " = " + percentageString;
        else 
          return "US$ -" + numFormat(value) + " = " + percentageString;
      });

  // Make the breadcrumb trail visible, if it's hidden.
  d3.selectAll(trail)
      .style("visibility", "");

}


// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how 
// often that sequence occurred.
function buildHierarchy(csv) {
//  console.log(csv);
  var root = {"name": "root", "children": []};
  for (var i = 0; i < csv.length; i++) {
    var seqLength = csv[i].length;
//    var sequence = csv[i][0];
    var size = +csv[i][seqLength-1];
    if (isNaN(size)) { // e.g. if this is a header row
      continue;
    }
//    var parts = sequence.split("-");
  
  var parts = csv[i].slice(0,seqLength-1);
    var currentNode = root;
    for (var j = 0; j < parts.length; j++) {
      var children = currentNode["children"];
      var nodeName = parts[j];
      var childNode;
      if (j + 1 < parts.length) {
   // Not yet at the end of the sequence; move down the tree.
 	var foundChild = false;
 	for (var k = 0; k < children.length; k++) {
 	  if (children[k]["name"] == nodeName) {
 	    childNode = children[k];
 	    foundChild = true;
 	    break;
 	  }
 	}
  // If we don't already have a child node for this branch, create it.
 	if (!foundChild) {
 	  childNode = {"name": nodeName, "children": [], "positive": true};
 	  children.push(childNode);
 	}
 	currentNode = childNode;
      } else {
 	// Reached the end of the sequence; create a leaf node.
 	childNode = {"name": nodeName, "size": Math.abs(size), "positive": size >= 0 ? true : false};
//  console.log(childNode);
 	children.push(childNode);
      }
    }
  }
  return root;
};