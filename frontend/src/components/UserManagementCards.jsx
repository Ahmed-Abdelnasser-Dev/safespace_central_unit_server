import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


function UserManagementCards() {
    const data = [
      {
        id:'total',
        icon: 'users',
        iconcolor: 'text-safe-blue-btn',
        label: 'Total Users',
        value: '24',
        trend: '+3 this month',
        trendPositive: true,
      },
      {
        id:'activity',
        icon: 'chart-line',
        iconcolor: 'text-safe-green',
        label: 'Active Users',
        value: '21',
        trend: '57.5%',
        trendPositive: true,
      },
      {
        id:'roles',
        icon: 'shield',
        iconcolor: 'text-safe-accent',
        label: 'Roles Assigned',
        value: '4',
        trend: 'standard',

      },
      {
        id:'logins',
        icon: 'chart-simple',
        iconcolor: 'text-safe-blue-btn',
        label: `Today's Logins`,
        value: '18',
        trend: '+5 from yesterday',
        trendPositive: true,
      },
    ];

    return (
      <div>
        <div className="grid grid-cols-4 gap-7">
        {data.map((data) => (
          <div key={data.id} className="bg-white rounded-xl p-6 border border-safe-border relative overflow-hidden">

            <div className="flex items-start justify-between mb-3">
                <div className="text-sm font-semibold text-safe-text-gray">{data.label}</div>
                <div className="flex items-center gap-1 text-2xl px-2 py-1">
                    <FontAwesomeIcon icon={data.icon} className={` ${data.iconcolor}`} />
                </div>
            </div>

            <div className="text-3xl font-bold text-safe-dark mb-5">{data.value}</div>
            <div className={`text-xs ${
                data.trendPositive === true ? 'text-safe-green' : data.trendPositive === false ? 'text-safe-danger' : 'text-safe-text-gray'}`}>{data.trend}
            </div>
          </div>
        ))}
        </div>
      </div>
    )
}

export default UserManagementCards;