import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Base Table Component
 * Reusable table structure with flexible column spacing
 * 
 * @param {Object} props
 * @param {Array} props.columns - Column definitions
 * @param {Array} props.data - Table data
 * @param {Function} props.onRowClick - Optional row click handler
 * @param {Function} props.renderCell - Custom cell renderer
 * @param {string} props.className - Additional classes
 */
function UsersTable({ columns, data, onRowClick, renderCell, className = '' }) {
  return (
    <div className={`mt-6 bg-white rounded-xl border border-safe-border overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          {/* Table Header */}
          <thead className="bg-safe-bg border-b border-safe-border">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-4 text-left text-xs font-bold text-safe-text-dark tracking-wider 
                    ${index === 0 ? 'pl-6' : ''} 
                    ${index === columns.length - 1 ? 'pr-6' : ''}
                    ${column.headerClass || ''}
                  `}
                  style={{ width: column.width || 'auto' }}
                >
                  <div className={`flex items-center gap-2 ${
                  column.headerClass?.includes('text-right') ? 'justify-end' : ''}`}>
                    {column.label}
                    {column.sortable && (
                      <FontAwesomeIcon 
                        icon="sort" 
                        className="text-xs text-safe-text-gray/50 cursor-pointer hover:text-safe-text-gray transition-colors" 
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-safe-border">
            {data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-safe-bg/30' : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-4 ${
                        colIndex === 0 ? 'pl-6' : ''
                      } ${colIndex === columns.length - 1 ? 'pr-6' : ''}`}
                      onClick={(e) => column.stopPropagation && e.stopPropagation()}
                    >
                      {renderCell ? renderCell(row, column, rowIndex) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-8 text-center text-safe-text-gray"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersTable;