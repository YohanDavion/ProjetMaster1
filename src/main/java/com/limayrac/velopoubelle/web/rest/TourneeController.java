package com.limayrac.velopoubelle.web.rest;

import com.limayrac.velopoubelle.domain.Tournee;
import com.limayrac.velopoubelle.service.TourneeService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tournees")
public class TourneeController {

    @Autowired
    private TourneeService tourneeService;

    @GetMapping
    public List<Tournee> getAllTournees() {
        return tourneeService.findAll();
    }

    @PostMapping
    public Tournee createTournee(@RequestBody Tournee tournee) {
        return tourneeService.save(tournee);
    }
}
