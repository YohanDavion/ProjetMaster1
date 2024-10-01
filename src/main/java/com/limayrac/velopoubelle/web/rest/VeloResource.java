package com.limayrac.velopoubelle.web.rest;

import com.limayrac.velopoubelle.domain.Velo;
import com.limayrac.velopoubelle.repository.VeloRepository;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST pour gérer les vélos.
 */
@RestController
@RequestMapping("/api")
public class VeloResource {

    private final VeloRepository veloRepository;

    public VeloResource(VeloRepository veloRepository) {
        this.veloRepository = veloRepository;
    }

    /**
     * GET  /velo : Obtenir tous les vélos.
     */
    @GetMapping("/velo")
    public List<Velo> getAllVelos() {
        return veloRepository.findAll();
    }

    /**
     * POST  /velo : Créer un nouveau vélo.
     */
    @PostMapping("/velo")
    public ResponseEntity<Velo> createVelo(@RequestBody Velo velo) throws URISyntaxException {
        if (velo.getIdVelo() != null) {
            // Si l'ID est déjà défini, cela signifie que le vélo existe déjà
            return ResponseEntity.badRequest().build();
        }
        Velo result = veloRepository.save(velo);
        return ResponseEntity.created(new URI("/api/velo/" + result.getIdVelo())).body(result);
    }

    /**
     * DELETE  /velo/:id : Supprimer un vélo.
     */
    @DeleteMapping("/velo/{id}")
    public ResponseEntity<Void> deleteVelo(@PathVariable Long id) {
        veloRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET  /velo/:id : Obtenir un vélo par son ID.
     */
    @GetMapping("/velo/{id}")
    public ResponseEntity<Velo> getVelo(@PathVariable Long id) {
        return veloRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
