package sportlink.sportlink.project.controladores;

import sportlink.sportlink.project.dto.ReseniaDto;
import sportlink.sportlink.project.servicios.ServicioResenia;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sportLink/Resenia")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class ControladorResenia {

    private final ServicioResenia servicioResenia;

    public ControladorResenia(ServicioResenia servicioResenia){
        this.servicioResenia = servicioResenia;
    }

    @GetMapping("/obtenerTodos")
    public List<ReseniaDto> obtenerResenias(){
        return servicioResenia.obtenerTodos();
    }

    @GetMapping("/obtener/{pkResenia}")
    public Optional<ReseniaDto> obtenerResenia(@PathVariable("pkResenia")int pkResenia){
        return servicioResenia.obtenerPorPk(pkResenia);
    }

    @PostMapping("/crear")
    @ResponseStatus(HttpStatus.CREATED)
    public ReseniaDto crear(@RequestBody ReseniaDto reseniaDto){
        return servicioResenia.crear(reseniaDto);
    }

    @PutMapping("/actualizar")
    @ResponseStatus(HttpStatus.CREATED)
    public ReseniaDto actualizar(@RequestBody ReseniaDto reseniaDto){
        return servicioResenia.actualizar(reseniaDto);
    }

    @DeleteMapping("/eliminarTodos")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public boolean eliminarTodos(){
        return servicioResenia.eliminarTodos();
    }

    @DeleteMapping("/eliminar/{pkResenia}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public boolean eliminar(@PathVariable("pkResenia") int pkResenia){
        return servicioResenia.eliminar(pkResenia);
    }
}
