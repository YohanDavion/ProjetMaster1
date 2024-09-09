package com.limayrac.velopoubelle.web.rest;

import com.limayrac.velopoubelle.domain.Velo;
import com.limayrac.velopoubelle.service.VeloService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VeloController {

    @Autowired
    private VeloService veloService;

    @GetMapping("/api/velos")
    public List<Velo> getAllVelos() {
        return veloService.findAll();
    }

    @PostMapping
    public Velo createVelo(@RequestBody Velo velo) {
        return veloService.save(velo);
    }
}
