// apps/web/app/hirfigyelo/beallitas/Beallitas.tsx — RÉSZLET (a Források szakasz)
              disabled={!szerkesztheto}
            />
          )}
        </div>

        {/* 2. szakasz: Források */}
        <div className="km-hf-be-szakasz">
          <Forrasok szerkesztheto={szerkesztheto} napiFigyeles={beallitas.idozites.mod === "napi"} />
        </div>

        {/* 3. szakasz: Pontosítás */}
