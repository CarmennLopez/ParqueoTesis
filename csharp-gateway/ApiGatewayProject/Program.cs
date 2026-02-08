using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;

// Configurar Serilog para logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/gateway-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Iniciando API Gateway...");

    var builder = WebApplication.CreateBuilder(args);

    // Usar Serilog
    builder.Host.UseSerilog();

    // Determinar qué archivo de configuración usar según el entorno
    var environment = builder.Environment.EnvironmentName;
    var ocelotConfigFile = $"ocelot.{environment}.json";
    
    // Si no existe el archivo específico del entorno, usar ocelot.json
    if (!File.Exists(Path.Combine(Directory.GetCurrentDirectory(), ocelotConfigFile)))
    {
        ocelotConfigFile = "ocelot.json";
        Log.Information($"Usando configuración por defecto: {ocelotConfigFile}");
    }
    else
    {
        Log.Information($"Usando configuración de entorno: {ocelotConfigFile}");
    }

    builder.Configuration.AddJsonFile(ocelotConfigFile, optional: false, reloadOnChange: true);

    // Configurar CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });

    // Configurar autenticación JWT
    var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") 
        ?? builder.Configuration["Jwt:Secret"] 
        ?? "tu-secret-key-super-segura-de-al-menos-32-caracteres";
    
    var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") 
        ?? builder.Configuration["Jwt:Issuer"] 
        ?? "parking-api";
    
    var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
        ?? builder.Configuration["Jwt:Audience"] 
        ?? "parking-users";

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer("Bearer", options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
            };

            // Log de eventos de autenticación
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    Log.Warning("Autenticación fallida: {Error}", context.Exception.Message);
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    Log.Information("Token validado correctamente");
                    return Task.CompletedTask;
                }
            };
        });

    // Health Checks
    builder.Services.AddHealthChecks()
        .AddUrlGroup(new Uri("http://app-backend:3000/health"), "Backend", timeout: TimeSpan.FromSeconds(5));

    // Añadir Ocelot
    builder.Services.AddOcelot(builder.Configuration);

    var app = builder.Build();

    // Middleware
    app.UseCors("AllowAll");
    
    // Health Check endpoint (ANTES de Ocelot para que no sea interceptado)
    app.MapHealthChecks("/health");
    
    app.UseAuthentication();
    app.UseAuthorization();

    // Ocelot (debe ir al final)
    await app.UseOcelot();

    Log.Information("API Gateway iniciado correctamente");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Error fatal al iniciar el API Gateway");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
