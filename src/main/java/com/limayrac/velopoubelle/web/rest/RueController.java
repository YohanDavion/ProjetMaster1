package com.limayrac.velopoubelle.web.rest;

import com.limayrac.velopoubelle.domain.Rue;
import com.limayrac.velopoubelle.service.RueService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rues")
public class RueController {

    @Autowired
    private RueService rueService;

    @GetMapping
    public List<Rue> getAllRues() {
        return rueService.findAll();
    }
}
