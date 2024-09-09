package com.limayrac.velopoubelle.service;

import com.limayrac.velopoubelle.domain.Velo;
import com.limayrac.velopoubelle.repository.VeloRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VeloService {

    @Autowired
    private VeloRepository veloRepository;

    public List<Velo> findAll() {
        return veloRepository.findAll();
    }

    public Velo save(Velo velo) {
        return veloRepository.save(velo);
    }
}
