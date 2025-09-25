package sportlink.sportlink.project.repositorios;


import sportlink.sportlink.project.entidades.Entrenador;
import sportlink.sportlink.project.repositorios.crud.CrudEntrenador;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class RepositorioEntrenador {

    private final CrudEntrenador crudEntrenador;

    public RepositorioEntrenador(CrudEntrenador crudEntrenador) {
        this.crudEntrenador = crudEntrenador;
    }

    public List<Entrenador> obtenerTodos(){
        return crudEntrenador.findAll();
    }

    public Optional<Entrenador> obtenerPorPk(int pkEntrenador){
        return crudEntrenador.findById(pkEntrenador);
    }

    public Entrenador crear(Entrenador entrenador){
        return crudEntrenador.save(entrenador);
    }

    public Entrenador actualizar(Entrenador entrenador){
        return crudEntrenador.save(entrenador);
    }

    public void eliminar(Entrenador entrenador){
        crudEntrenador.delete(entrenador);
    }

    public void eliminarTodos(){
        crudEntrenador.deleteAll();
    }

}
