import { Link } from '@tanstack/react-router';

export function SideNav() {
	return (
		<aside className="fixed left-0 top-0 h-full w-[260px] border-r border-wireframe-border bg-surface p-4">
			<div className="mb-6 text-lg font-semibold">CMD</div>
			<nav className="flex flex-col gap-2">
				<Link to="/" className="px-3 py-2 rounded hover:bg-wireframe-bg-alt">Dashboard</Link>
				<Link to="/orders" className="px-3 py-2 rounded hover:bg-wireframe-bg-alt">Orders</Link>
				<Link to="/leads" className="px-3 py-2 rounded hover:bg-wireframe-bg-alt">Leads</Link>
				<Link to="/users" className="px-3 py-2 rounded hover:bg-wireframe-bg-alt">Users</Link>
				<Link to="/roles" className="px-3 py-2 rounded hover:bg-wireframe-bg-alt">Roles</Link>
			</nav>
		</aside>
	);
}
