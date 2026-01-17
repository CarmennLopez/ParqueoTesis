using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

// 1. Cargar la configuración de ocelot.json
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// 2. Añadir Ocelot a los servicios
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

// 3. Usar el middleware de Ocelot
// Es importante que sea una de las últimas cosas que se configuren
await app.UseOcelot();

app.Run();
