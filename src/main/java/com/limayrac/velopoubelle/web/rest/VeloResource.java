package com.limayrac.velopoubelle.web.rest;

import com.limayrac.velopoubelle.domain.Velo;
import com.limayrac.velopoubelle.repository.VeloRepository;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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

    /**
     * GET /velo-with-position : Obtenir tous les vélos avec leurs positions en format { lat, lng }.
     */
    @GetMapping("/velo-with-position")
    public List<Map<String, Object>> getVelosWithPosition() {
        List<Velo> velos = veloRepository.findAll();
        return velos
            .stream()
            .map(velo -> {
                Map<String, Object> result = new HashMap<>();
                result.put("idVelo", velo.getIdVelo());
                result.put("autonomie", velo.getAutonomie());
                result.put("capacite", velo.getCapacite());
                result.put("etat", velo.getEtat());
                result.put("position", velo.getPositionObject()); // Appelle la méthode de l'entité
                return result;
            })
            .collect(Collectors.toList());
    }
}
