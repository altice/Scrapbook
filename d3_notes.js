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
		
