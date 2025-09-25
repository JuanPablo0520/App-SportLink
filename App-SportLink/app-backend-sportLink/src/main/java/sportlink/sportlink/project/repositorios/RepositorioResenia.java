package sportlink.sportlink.project.repositorios;

import sportlink.sportlink.project.entidades.Resenia;
import sportlink.sportlink.project.repositorios.crud.CrudResenia;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class RepositorioResenia {

    private final CrudResenia crudResenia;

    public RepositorioResenia(CrudResenia crudResenia) {
        this.crudResenia = crudResenia;
    }

    public List<Resenia> obtenerTodos(){
        return crudResenia.findAll();
    }

    public Optional<Resenia> obtenerPorPk(int pkResenia){
        return crudResenia.findById(pkResenia);
    }

    public Resenia crear(Resenia resenia){
        return crudResenia.save(resenia);
    }

    public Resenia actualizar(Resenia resenia){
        return crudResenia.save(resenia);
    }

    public void eliminar(Resenia resenia){
        crudResenia.delete(resenia);
    }

    public void eliminarTodos(){
        crudResenia.deleteAll();
    }
}
