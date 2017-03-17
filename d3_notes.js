<script d3-array.min.js.
<script src = 


<style>

line, path, .domain, .bar {
	stroke:
}
</style>

var data = [
	{ 	key:'A', value:1,
		key:'B', value:2}
]

g.append('g')
	.attr('transform','translate('+ x(1) + ',0)')
	.attr('class','axis')
	.call(d3.axisLeft(y)
			.ticks(20)
			.tickFormat(".0s")));

g.append('g'
	.attr('transform', 'translate(' + x(2) + ',0)')
	.attr('class', 'axis')
	.call(d3.axisLeft(y)
			.ticks(20)
			.tickFormat(d3.formatPrefix('.1',1e6))

holder.append('circle')
		.attr('cx',200)
		.attr('cy',100)
		.attr('r',50)
		.attr('stroke','red')
		.style('fill', 'none')

.attr('r', function (){ return d.r})
.call(drag()
		.on('start', dragstarted)
		.on('drag', dragended)	
		.on('end(', dragendedn )	

data.forEach(function(d){
	d.date = parseTime(d.date)
	d.close = +d.close
})

var scaleX = d3.scaleBand()
	.domain(data.map ( function(d){ return d.key;}))
	.range(0, chartWidth)
	.paddingInner(.1)
	.paddingOuter(.3)
	.align(.5) // centering it

var scaleY = d3.scale.scaleLinear()
				.domain([0,d3_array.max(data.map(function(d){return d.value;})) )
				.range(0,chartHeight)



var xaxis = d3.axisBottom(scaleX)
				.tickSizeInner(4)
				.tickSizeOuter(20)
				.tickPadding(3)

panel.selectAll('rect.bar')
	.data(data)
	.enter().append('rect')
	.attr('class', 'bar')
	.attr('width',scaleX.bandwidth())
	.attr('height', function(d) { return scaleX(d.key);})
	.attr('y', function(d){ return -scaleY(d.value)})


