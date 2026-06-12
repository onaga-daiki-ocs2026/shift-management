function Layout({ title, children }) {
	return (
		<div className="app">
			<header className="app-header">
				<h1>{title}</h1>
			</header>

			<main className="app-main">{children}</main>
		</div>
	);
}

export default Layout;
