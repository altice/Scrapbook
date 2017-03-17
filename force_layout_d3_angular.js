neutronControllers.directive('dashboardModelViewer', ['Model', '$timeout', function (Model, $timeout) {
    return {
        template: '<div class="widget"> \
                        <div class="widgetheader">Model \
                                <span class="widgethelp"><img src="../images/reload_icon.png" height="20" ng-click="complete_redo()"/> \
                        </div> \
                        <div class="widgetcontent noscroll" id="blaa"> \
                            <div class="dashboard_error_message" ng-show="modelErrorMessage"> \
                                {{modelErrorMessage}} \
                            </div> \
                           <div class="modeldiv" id="modeldiv"> \
                                <svg id="modelsvgcanvas"></svg> \
                           </div> \
                        </div> \
                    </div> ',
        scope: {
            nodes: "=",
            model: "="
        },
        link: function (scope, element, attrs) {

            scope.gridster_item = null;
            scope.simulation = null;
            scope.svg = null;
            var structure = null;
            graph = {}
            graph['links'] = [];
            graph['nodes'] = [];
            var hashdictionary = {};

            var colors = [];
            colors['hypothesis'] = '#16a085';
            colors['other'] = '#2980b9';
            colors['evidence'] = '#95a5a6';
            colors['positive'] = '#2e7c5e';//'#27ae60';
            colors['negative'] = '#7a4145';//'#c0392b';
            
            var radius = [];
            radius['hypothesis'] = '20';
            radius['other'] = '12';
            radius['evidence'] = '7';
            radius['hidden'] = '0';
            
            var linkweights = [];
            linkweights['absolute'] = 4;
            linkweights['strong'] = 3;
            linkweights['medium'] = 2;
            linkweights['weak'] = 1;
            linkweights['definition'] = 6;
            
            var opacity = [];
            opacity['true'] = 1.0;
            opacity['false'] = 0.3;

            scope.init_model = function() {

                // Reset
                d3.select("#modelsvgcanvas").selectAll("*").remove();
                d3.select("#modelsvgcanvas").call(d3.zoom().transform, d3.zoomIdentity);

                var svg = scope.svg = d3.select("#modelsvgcanvas")
                                        .call(d3.zoom().on("zoom", function () {scope.svg.attr("transform", d3.event.transform)}))
                                        .append("g");

                var width = +scope.svg.attr("width");
                var height = +scope.svg.attr("height");
                                
                scope.simulation = d3.forceSimulation()
                    .force("link", d3.forceLink().distance(60).id(function(d) { return d.id; }))
                    .force("charge", d3.forceManyBody().strength(-300))
                    .velocityDecay(0.2)
                    //.force("link", d3.forceLink().distance(75).id(function(d) { return d.id; }))
                    //.force("charge", d3.forceManyBody().strength(-250))
                    .force('Y', d3.forceY().y(function(d) { return 1; }))
                    .force('X', d3.forceX().x(function(d) { return 0; }))
                    .force("center", d3.forceCenter((width-40) / 2, (height-75) / 2))
                    .force("collide", d3.forceCollide(10.0));
            }

            scope.find_node_index_in_hash = function(name, structure) {
                var hashindex = -1;
                if (hashdictionary.hasOwnProperty(name)) {
                    hashindex = hashdictionary[name];
                } else if (name) {
                    for (var m = 0; m < structure.concepts.length; m++) {
                        if (structure.concepts[m].subjectConceptFullName == name) {
                            hashindex = m;
                            hashdictionary[name] = hashindex;
                            break;
                        }
                    }
                }
                if (hashindex == -1)
                    debugger
                return hashindex;
            }

            scope.add_level = function (conceptname, level=0) {
                var concept = scope.model.conceptdict[conceptname];
                if (concept.level < level)
                    // Going back up the tree so stop
                    return;

                // Keep the lowest level we encounter
                if (!concept.level || (level < concept.level ))
                    concept.level = level;


                for (var j=0; j<concept.influencedByConcepts.length; j++) {
                    // And link to nodes that influence
                    scope.add_level( concept.influencedByConcepts[j].influencedByConceptFullName, level+1);
                }
                for (var j=0; j<concept.influencedConcepts.length; j++) {
                    // And link to nodes that influence
                    scope.add_level( concept.influencedConcepts[j].influencedConceptFullName, level+1);
                }
            }

            scope.convertgraphford3 = function (structure, top_level_nodes, nodes) {
                graph = {}
                graph['links'] = [];
                graph['nodes'] = [];
                                 
                graph.nodes.push({});
                
                // This function adds some reverse relationships to allow the rendering function to draw all
                // nodes within x levels from the focus nodes.  Since relationships are one-way, it was missing
                // Many neighboring links/nodes because of the directed nature of the graph.
                // Adds a new "influencedByConcepts" array.
                
                ConsoleLog('PROCESSING GRAPH');
                for (var x=0; x<structure.concepts.length; x++) {
                    structure.concepts[x].influencedByConcepts = [];
                }
                
                for (var x=0; x<structure.concepts.length; x++) {
                    for (var y=0; y<structure.concepts[x].influencedConcepts.length; y++) {
                    
                        influencedConcept = structure.concepts[x].influencedConcepts[y];
                        
                        var target_node_index = scope.find_node_index_in_hash(structure.concepts[x].influencedConcepts[y].influencedConceptFullName, structure);
                        
                        var newInfluence = {};
                        newInfluence['influenceType'] = influencedConcept.influenceType;
                        newInfluence['influencePolarity'] = influencedConcept.influencePolarity;
                        newInfluence['influencedByConceptFullName'] = structure.concepts[x].subjectConceptFullName;
                        newInfluence['influenceStrength'] = influencedConcept.influenceStrength;

                        //structure.conceptdict[structure.concepts[x].influencedConcepts[y].influencedConceptFullName].influencedByConcepts.push(newInfluence);                   
                        structure.concepts[target_node_index].influencedByConcepts.push(newInfluence);
                    }
                }
                ConsoleLog('DONE');

                for (var index=0; index < top_level_nodes.length; index++) {    
                    var node = top_level_nodes[index];
                    scope.add_level(node);
                    scope.add_node(node, structure, 2);
                }
                
                for (var index=0; index < nodes.length; index++) {    
                    var node = nodes[index];
                    scope.expand_to(scope.model.conceptdict[node], structure);
                }
                
                return graph;
            }

            scope.complete_redo = function () {
                scope.init_model();
                scope.reload();
            }
            scope.clear = function () {
                scope.svg.selectAll('g').remove();
            }
            scope.reload = function () {
                if (scope.model && scope.nodes) {
                    structure = scope.model;

                    // Take structure from model API call and convert to graph for D3 use
                    graph = scope.convertgraphford3( scope.model, scope.model.hypothesis_nodes, scope.nodes);
                    
                    // Update the D3 structure and render
                    scope.update(graph);
                }

            }

            scope.$watch("model", function (model, newmodel) {
                ConsoleLog("Model Changed");
                // Reset the hash dictionary
                hashdictionary = {};
            });

            scope.$on('filter-change', function(event, filterset) {
                scope.complete_redo();
            });

            scope.update = function (graph) {
                
                scope.svg.selectAll('g').remove();
    
                var link = scope.svg
                                .append("g")
                                .selectAll("line")
                                .data(graph.links)
                                .enter()
                                .append("line")
                                .attr("stroke-opacity", 1.0)
                                .attr("stroke-width", function(d) { if (d.strength in linkweights) return linkweights[d.strength]; else return 5; })
                                .attr("stroke", function(d) { if (d.polarity in colors) return colors[d.polarity]; else return "#95a5a6"; });
                                                                    
                // Define the data for the circles
                var elem = scope.svg.selectAll("g")
                    .data(graph.nodes);

                function dragstarted(d) {
                if (!d3.event.active) 
                    scope.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
                }

                function dragged(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
                }

                function dragended(d) {
                if (!d3.event.active) 
                    scope.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
                }
                
                function expand_from_node(d, depth=1) {
                    node_index = scope.find_node_index_in_hash(d.id, structure);
                    var conceptnode = structure.concepts[node_index]; // structure.conceptdict[d.id];
                    node_id = d.id;
                    var level = conceptnode.level;
                    
                    for (var j=0; j<conceptnode.influencedByConcepts.length; j++) {
                        // And link to nodes that influence
                        scope.add_link(conceptnode.influencedByConcepts[j].influencedByConceptFullName,
                                node_id,
                                conceptnode.influencedByConcepts[j].influenceStrength,
                                conceptnode.influencedByConcepts[j].influencePolarity);
                        scope.add_node(conceptnode.influencedByConcepts[j].influencedByConceptFullName, structure, depth-1);
                    }
                    for (var j=0; j<conceptnode.influencedConcepts.length; j++) {
                        // Add link to influenced nodes
                        scope.add_link(node_id,
                                conceptnode.influencedConcepts[j].influencedConceptFullName,
                                conceptnode.influencedConcepts[j].influenceStrength,
                                conceptnode.influencedConcepts[j].influencePolarity);
                        scope.add_node(conceptnode.influencedConcepts[j].influencedConceptFullName, structure, depth-1);
                    }
                        
                    scope.update(graph);
                }
                
                function click(d) {
                    expand_from_node(d);
                }
                
                function dblclick(d) {
                    expand_from_node(d,2);
                }
                
                // Seems that in D# you need to detect double clicks ourselves 
                var clickedOnce = false;
                var timerClickedOnce;

                // Start a check to see if the click is a double click
                function checkclick(d){
                    if (clickedOnce) {
                        // If already clicked once then this is a double
                        run_on_double_click(d);
                    } else {
                        // Save the first click and start a timer to 
                        // clear that state and perform a single click
                        timerClickedOnce = setTimeout(run_on_simple_click, 300, d);
                        clickedOnce = true;
                    }
                }

                // Perform a single click
                function run_on_simple_click(d) {
                    ConsoleLog("simpleclick");
                    clickedOnce = false;
                    click(d);
                }

                // Perform the double click and clear the timer
                function run_on_double_click(d) {
                    clickedOnce = false;
                    clearTimeout(timerClickedOnce);
                    ConsoleLog("doubleclick");
                    dblclick(d);
                }

                // Create and place the "blocks" containing the circle and the text
                var node = elem.enter()
                    .append("g")
                    //.on("dblclick", dblclick)
                    .on("click", checkclick)
                    .call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended)
                        );

                // Create the circle for each block
                var circle = node.append("circle")
                    .attr("r", function(d) { return radius[d.type] })
                    .attr("stroke", '#bdc3c7')
                    .attr("stroke-width", function(d) {
                                    //if (d.hasOwnProperty('collapsed') && d.collapsed == true) return "0.2em"; else return "0.1em"
                                    total_number_of_links = d.influenced_concepts_count + d.influenced_by_concepts_count;
                                    if (total_number_of_links > 10)
                                        total_number_of_links = 10;
                                    return 1+ total_number_of_links/2 + "px";
                                })
                    //.attr("stroke-width", function(d) { if (d.connections > 0) return "0."+d.connections+"em"; else return "0.1em"; })
                    .attr("fill", function(d) { if (d.sentiment) return colors[d.sentiment]; else return colors[d.type]; })
                    .attr("opacity", function(d) { return 1.0; })
                    .append("title")
                    .text(function(d) { 
                        return d.display_name; // + " " + d.level.toString(); 
                    });
                    
                // Create the text for each block
                node.append("text")
                    .attr("dx", function(d) { 
                        if (!d)
                            debugger;
                        if (isNaN(parseInt(radius[d.type])))
                            debugger;
                        return parseInt(radius[d.type]) + 2; 
                    })
                    .attr("dy", 5 )
                    .attr("fill", '#7f8c8d')//function(d) { return colors[d.type]; })
                    .attr("font-size", "10px")
                    .attr("opacity", function(d) { return opacity[d.is_implemented]; })
                    .text(function(d) { if (d.type == 'hidden') return ''; else return d.display_name}); // + " " + d.level.toString()});

                scope.simulation
                    .nodes(graph.nodes)
                    .on("tick", ticked);

                scope.simulation.force("link")
                    .links(graph.links);

                function ticked() {
                    link
                        .attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });

                    node
                        //.attr("x", function(d) { return d.x; })
                        //.attr("y", function(d) { return d.y; });
                        .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"})
                }
                
                scope.resize(scope.gridster_item.getElementSizeX(), scope.gridster_item.getElementSizeY());

            }

            scope.add_link = function (sourcename, targetname, strength, polarity) {
                var link = {};
                link.source = sourcename;
                link.target = targetname;
                link.polarity = polarity;
                link.strength = strength;
                //ConsoleLog('Adding link from ' + sourcename + ' to ' + targetname);
                for (var foo=0; foo<graph.links.length; foo++) {
                    if (graph.links[foo].source.id == sourcename && graph.links[foo].target.id == targetname) {
                        // already there
                        return;
                    }
                }
                graph.links.push(link);
            }
            
            scope.add_node = function(name, structure, level) {
                
                //ConsoleLog('Adding node ' + name);
                
                // Get the index of the node from the model structure
                var node_index = scope.find_node_index_in_hash(name, structure);
                if (node_index < 0) { //(!(name in structure.conceptdict)) {//
                    return false;
                }
                var conceptnode = structure.concepts[node_index];

                // Do not add if the node already exists in the D3 graph
                for (z=0; z<graph.nodes.length; z++) {
                    if (graph.nodes[z].id == name) {
                        return false;
                    }
                }
                
                // Add the node to the D3 graph
                var node = {};
                node.display_name = conceptnode.display_name;
                node.id = conceptnode.subjectConceptFullName;
                node.description = conceptnode.sourceExcerpt;
                node.influenced_concepts_count = conceptnode.influencedConcepts.length;
                node.influenced_by_concepts_count = conceptnode.influencedByConcepts.length;
                node.type = 'other';
                node.level = conceptnode.level;
                if (conceptnode.hasOwnProperty('isFocusConcept') && conceptnode.isFocusConcept == true) {
                    node.type = 'hypothesis';
                }
                node.sentiment = '';
                if (conceptnode.hasOwnProperty('sentimentDirective')) {
                    node.sentiment = conceptnode.sentimentDirective.sentiment;
                }
                graph.nodes.push(node);

                // Add all links and then add the target nodes on the end of those links
                if (level > 0) {
                    for (var j=0; j<conceptnode.influencedByConcepts.length; j++) {
                        // And link to nodes that influence
                        scope.add_link(conceptnode.influencedByConcepts[j].influencedByConceptFullName,
                                node.id,
                                conceptnode.influencedByConcepts[j].influenceStrength,
                                conceptnode.influencedByConcepts[j].influencePolarity);
                        scope.add_node(conceptnode.influencedByConcepts[j].influencedByConceptFullName, structure, level-1);
                    }
                    for (var j=0; j<conceptnode.influencedConcepts.length; j++) {
                        // Add link to influenced nodes
                        scope.add_link(node.id,
                                conceptnode.influencedConcepts[j].influencedConceptFullName,
                                conceptnode.influencedConcepts[j].influenceStrength,
                                conceptnode.influencedConcepts[j].influencePolarity);
                        scope.add_node(conceptnode.influencedConcepts[j].influencedConceptFullName, structure, level-1);
                    }
                }
                return true;
            }

            scope.find_shortest_path = function(conceptnode, structure, path) {
                if (!path) {
                    // Add this node to the path
                    path = [{name: conceptnode.subjectConceptFullName}];
                }
                // If this is a top level (hypothesis node) stop
                if (conceptnode.level == 0)
                    return path;

                var shortest = null;
                for (var j=0; j<conceptnode.influencedByConcepts.length; j++) {
                    var node = scope.model.conceptdict[conceptnode.influencedByConcepts[j].influencedByConceptFullName];
                    // Only go up the tree
                    if (node.level < conceptnode.level) {
                        var list = path.slice(0);
                        list.push({name: conceptnode.influencedByConcepts[j].influencedByConceptFullName,
                            influenceStrength: conceptnode.influencedByConcepts[j].influenceStrength,
                            influencePolarity: conceptnode.influencedByConcepts[j].influencePolarity});

                        // Find and keep the shortest path down the tree
                        var newpath = scope.find_shortest_path(node, structure, list);
                        if (!shortest || (newpath.length < shortest.length)) {
                            shortest = newpath;
                        }
                    }
                }
                for (var j=0; j<conceptnode.influencedConcepts.length; j++) {
                    var node = scope.model.conceptdict[conceptnode.influencedConcepts[j].influencedConceptFullName];
                    // Only go up the tree
                    if (node.level < conceptnode.level) {
                        var list = path.slice(0);
                        list.push({name: conceptnode.influencedConcepts[j].influencedConceptFullName,
                            influenceStrength: conceptnode.influencedConcepts[j].influenceStrength,
                            influencePolarity: conceptnode.influencedConcepts[j].influencePolarity});

                        // Find and keep the shortest path down the tree
                        var newpath = scope.find_shortest_path(node, structure, list);
                        if (!shortest || (newpath.length < shortest.length)) {
                            shortest = newpath;
                        }
                    }
                }
                return shortest;
            }

            scope.expand_to = function(node, structure) {
                var path = scope.find_shortest_path(node, structure);
                var previousAdded = false;
                // Loop through the nodes to expand to
                for (var index=0; index<path.length; index++) {
                    // Add the new node if it is needed
                    var added = scope.add_node(path[index].name, structure);
                    if (previousAdded) {
                        // If the previous node was added then create a link to it
                        scope.add_link(path[index-1].name,
                                path[index].name,
                                path[index].influenceStrength,
                                path[index].influencePolarity);
                    }
                    previousAdded = added;
                    // If the node already existed, then we can stop
                    if (!added) 
                        break;
                }
            }

            scope.resize = function(w,h) {
                if (scope.simulation) {
                    scope.simulation.force("center", d3.forceCenter((w - 40) / 2, (h - 75) / 2));
                    $('#modelsvgcanvas').css({
                        'width': (w - 40) + 'px',
                        'height': (h - 75) + 'px'
                    });
                }
            }
            
            scope.$on('gridster-item-initialized', function(item) {
                scope.gridster_item = item.targetScope.gridsterItem;
            });
            
            scope.$on('gridster-item-resized', function(item) {
                scope.resize( item.targetScope.gridsterItem.getElementSizeX(), item.targetScope.gridsterItem.getElementSizeY());
            });
        }
    }
}]);
