# Fase de construcción
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["ApiGatewayProject.csproj", "."]
RUN dotnet restore "ApiGatewayProject.csproj"
COPY . .
RUN dotnet build "ApiGatewayProject.csproj" -c Release -o /app/build

# Fase de publicación
FROM build AS publish
RUN dotnet publish "ApiGatewayProject.csproj" -c Release -o /app/publish

# Fase final
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# ⭐ VERIFICAR que ocelot.json esté presente (opcional, para debug)
# RUN ls -la

ENTRYPOINT ["dotnet", "ApiGatewayProject.dll"]
