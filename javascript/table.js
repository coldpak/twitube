/**
 * This function generates basic table structure on DOM tree, 
 * returns dictionary of function for updating inner values.
 * 
 * @param {string} id 
 */
function Table(id) {
    const dom    = document.getElementById(id),
          width  = dom.clientWidth,
          height = dom.clientHeight;
    // Create table and basic structure
    const table = d3.select(`#${id}`)
                    .append('table')
                        .attr('width', width)
                        .attr('height', height)
                        .style("border-collapse", "collapse")
                        .style("border", "2px black solid");
    const thead = table.append('thead'),
          tbody = table.append('tbody');

    const headRow = thead.append('tr');
    headRow.append('th')
            .text('subject');
    headRow.append('th')
            .text('value');
    
    return {
        Update: (dataset, user, platform) => {
            const data = getTableData(dataset, user, platform)
            if (!data) return;
            const rows = tbody.selectAll('tr')
                              .data(data, d=>d.id);
            rows.exit()
                .remove();
            const row = rows.enter()
                            .append('tr');

            row.append('th')
                    .text(d => d.subject);
                    
            row.append('td')
                    .text(d => d.value);
        } 
    }
}