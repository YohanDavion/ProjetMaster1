package com.limayrac.velopoubelle.web.rest;

import com.limayrac.velopoubelle.domain.Arret;
import com.limayrac.velopoubelle.service.ArretService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
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
}
