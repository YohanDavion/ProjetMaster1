package com.limayrac.velopoubelle.web.rest;

import com.limayrac.velopoubelle.domain.Arret;
import com.limayrac.velopoubelle.service.ArretService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/arrets")
public class ArretController {

    @Autowired
    private ArretService arretService;

    @GetMapping
    public List<Arret> getAllArrets() {
        return arretService.getAllArrets();
    }

    // Nouveau endpoint pour mettre à jour le statut de vidage
    @PutMapping("/{id}/vider")
    public ResponseEntity<Void> viderPoubelle(@PathVariable Long id) {
        arretService.viderPoubelle(id);
        return ResponseEntity.ok().build();
    }
}
