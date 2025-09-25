package sportlink.sportlink.project.controladores;

import sportlink.sportlink.project.dto.ServicioDto;
import sportlink.sportlink.project.servicios.ServicioServicio;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sportLink/Servicio")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class ControladorServicio {

    private final ServicioServicio servicioServicio;

    public ControladorServicio(ServicioServicio servicioServicio){
        this.servicioServicio = servicioServicio;
    }

    @GetMapping("/obtenerTodos")
    public List<ServicioDto> obtenerServicio(){
        return servicioServicio.obtenerTodos();
    }

    @GetMapping("/obtener/{pkServicio}")
    public Optional<ServicioDto> obtenerServicio(@PathVariable("pkServicio")int pkServicio){
        return servicioServicio.obtenerPorPk(pkServicio);
    }

    @PostMapping("/crear")
    @ResponseStatus(HttpStatus.CREATED)
    public ServicioDto crear(@RequestBody ServicioDto servicioDto){
        return servicioServicio.crear(servicioDto);
    }

    @PutMapping("/actualizar")
    @ResponseStatus(HttpStatus.CREATED)
    public ServicioDto actualizar(@RequestBody ServicioDto servicioDto){
        return servicioServicio.actualizar(servicioDto);
    }

    @DeleteMapping("/eliminarTodos")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public boolean eliminarTodos(){
        return servicioServicio.eliminarTodos();
    }

    @DeleteMapping("/eliminar/{pkServicio}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public boolean eliminar(@PathVariable("pkServicio") int pkServicio){
        return servicioServicio.eliminar(pkServicio);
    }
}
