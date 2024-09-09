package com.limayrac.velopoubelle.service;

import com.limayrac.velopoubelle.domain.Tournee;
import com.limayrac.velopoubelle.repository.TourneeRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TourneeService {

    @Autowired
    private TourneeRepository tourneeRepository;

    public List<Tournee> findAll() {
        return tourneeRepository.findAll();
    }

    public Tournee save(Tournee tournee) {
        return tourneeRepository.save(tournee);
    }
}
